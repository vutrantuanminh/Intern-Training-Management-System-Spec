import { useState, useEffect, useRef } from 'react';
import { api } from '../../lib/apiClient';
import { Send, Search, Plus, X, Loader2, MessageSquare, Users } from 'lucide-react';

interface ChatInterfaceProps {
  currentUserId: string;
}

interface ChatRoom {
  id: number;
  name: string | null;
  isGroup: boolean;
  members: { id: number; fullName: string; email: string; avatar?: string }[];
  lastMessage: { id: number; content: string; senderId: number; createdAt: string } | null;
}

interface Message {
  id: number;
  roomId: number;
  senderId: number;
  content: string;
  createdAt: string;
  sender: { id: number; fullName: string; avatar?: string };
}

export function ChatInterface({ currentUserId }: ChatInterfaceProps) {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [groupName, setGroupName] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const userId = parseInt(currentUserId);

  // Load rooms on mount
  useEffect(() => {
    loadRooms();
  }, []);

  // Load messages when room selected
  useEffect(() => {
    if (selectedRoom) {
      loadMessages(selectedRoom.id);
    }
  }, [selectedRoom]);

  // Scroll to bottom when new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadRooms = async () => {
    try {
      setLoading(true);
      const response: any = await api.get('/chat/rooms');
      setRooms(response.data || []);
    } catch (error) {
      console.error('Failed to load chat rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (roomId: number) => {
    try {
      setLoadingMessages(true);
      const response: any = await api.get(`/chat/rooms/${roomId}/messages?limit=50`);
      setMessages(response.data || []);
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setLoadingMessages(false);
    }
  };

  const loadAvailableUsers = async () => {
    try {
      const response: any = await api.get('/chat/users');
      setAvailableUsers(response.data || []);
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedRoom || sending) return;

    const content = messageInput.trim();
    setMessageInput('');
    setSending(true);

    try {
      const response: any = await api.post(`/chat/rooms/${selectedRoom.id}/messages`, { content });
      setMessages([...messages, response.data]);
      // Update room's last message
      setRooms(rooms.map(r =>
        r.id === selectedRoom.id
          ? { ...r, lastMessage: response.data }
          : r
      ));
    } catch (error) {
      console.error('Failed to send message:', error);
      setMessageInput(content); // Restore message on error
    } finally {
      setSending(false);
    }
  };

  const handleCreateRoom = async () => {
    if (selectedUsers.length === 0) return;

    try {
      const isGroup = selectedUsers.length > 1;
      const response: any = await api.post('/chat/rooms', {
        participantIds: selectedUsers,
        isGroup,
        name: isGroup ? groupName || undefined : undefined,
      });

      setRooms([response.data, ...rooms]);
      setSelectedRoom(response.data);
      setShowNewChat(false);
      setSelectedUsers([]);
      setGroupName('');
    } catch (error) {
      console.error('Failed to create room:', error);
      alert('Failed to create conversation');
    }
  };

  const getRoomName = (room: ChatRoom) => {
    if (room.name) return room.name;
    const otherMember = room.members.find(m => m.id !== userId);
    return otherMember?.fullName || 'Unknown';
  };

  const getRoomAvatar = (room: ChatRoom) => {
    if (room.isGroup) return '👥';
    const otherMember = room.members.find(m => m.id !== userId);
    return otherMember?.fullName?.charAt(0) || '?';
  };

  const filteredRooms = rooms.filter(room =>
    getRoomName(room).toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="h-[calc(100vh-8rem)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Conversations List */}
      <div className="w-80 border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-lg">Messages</h4>
            <button
              onClick={() => {
                setShowNewChat(true);
                loadAvailableUsers();
              }}
              className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              title="New conversation"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredRooms.length > 0 ? (
            filteredRooms.map((room) => {
              const isActive = selectedRoom?.id === room.id;

              return (
                <button
                  key={room.id}
                  onClick={() => setSelectedRoom(room)}
                  className={`w-full p-4 flex items-start gap-3 hover:bg-gray-50 border-b border-gray-100 transition-colors ${isActive ? 'bg-indigo-50' : ''
                    }`}
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white flex-shrink-0 ${room.isGroup ? 'bg-purple-600' : 'bg-indigo-600'
                    }`}>
                    {getRoomAvatar(room)}
                  </div>
                  <div className="flex-1 text-left overflow-hidden">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-gray-900 truncate">{getRoomName(room)}</span>
                      {room.lastMessage && (
                        <span className="text-gray-400 text-xs">
                          {formatTime(new Date(room.lastMessage.createdAt))}
                        </span>
                      )}
                    </div>
                    {room.lastMessage && (
                      <p className="text-gray-600 text-sm truncate">
                        {room.lastMessage.senderId === userId && 'You: '}
                        {room.lastMessage.content}
                      </p>
                    )}
                  </div>
                </button>
              );
            })
          ) : (
            <div className="p-4 text-center text-gray-500">
              <MessageSquare className="w-8 h-8 mx-auto mb-2" />
              <p>No conversations yet</p>
              <button
                onClick={() => {
                  setShowNewChat(true);
                  loadAvailableUsers();
                }}
                className="text-indigo-600 hover:underline mt-2"
              >
                Start a new one
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      {selectedRoom ? (
        <div className="flex-1 flex flex-col">
          {/* Chat Header */}
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${selectedRoom.isGroup ? 'bg-purple-600' : 'bg-indigo-600'
                }`}>
                {getRoomAvatar(selectedRoom)}
              </div>
              <div>
                <div className="font-medium text-gray-900">{getRoomName(selectedRoom)}</div>
                <div className="text-gray-500 text-sm">
                  {selectedRoom.isGroup ? `${selectedRoom.members.length} members` : 'Online'}
                </div>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {loadingMessages ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
              </div>
            ) : messages.length > 0 ? (
              <>
                {messages.map((message) => {
                  const isOwnMessage = message.senderId === userId;

                  return (
                    <div key={message.id} className={`flex gap-3 ${isOwnMessage ? 'flex-row-reverse' : ''}`}>
                      {!isOwnMessage && (
                        <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white flex-shrink-0 text-sm">
                          {message.sender?.fullName?.charAt(0) || '?'}
                        </div>
                      )}
                      <div className={`max-w-md ${isOwnMessage ? 'items-end' : 'items-start'} flex flex-col`}>
                        {!isOwnMessage && selectedRoom.isGroup && (
                          <span className="text-gray-700 text-sm mb-1">{message.sender?.fullName}</span>
                        )}
                        <div className={`px-4 py-2 rounded-lg ${isOwnMessage ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-900'
                          }`}>
                          {message.content}
                        </div>
                        <span className="text-gray-400 text-xs mt-1">
                          {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                No messages yet. Start the conversation!
              </div>
            )}
          </div>

          {/* Message Input */}
          <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                disabled={sending}
              />
              <button
                type="submit"
                disabled={sending || !messageInput.trim()}
                className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-500">
          <div className="text-center">
            <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p>Select a conversation to start messaging</p>
          </div>
        </div>
      )}

      {/* New Chat Modal */}
      {showNewChat && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h4 className="text-lg font-semibold">New Conversation</h4>
              <button
                onClick={() => {
                  setShowNewChat(false);
                  setSelectedUsers([]);
                  setGroupName('');
                }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-96 overflow-y-auto">
              {selectedUsers.length > 1 && (
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Group Name (optional)</label>
                  <input
                    type="text"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    placeholder="Enter group name..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Select participants ({selectedUsers.length} selected)
                </label>
                <div className="space-y-2">
                  {availableUsers.map((user) => (
                    <label
                      key={user.id}
                      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${selectedUsers.includes(user.id) ? 'bg-indigo-50 border border-indigo-200' : 'bg-gray-50 hover:bg-gray-100'
                        }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedUsers([...selectedUsers, user.id]);
                          } else {
                            setSelectedUsers(selectedUsers.filter(id => id !== user.id));
                          }
                        }}
                        className="w-4 h-4 text-indigo-600"
                      />
                      <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white">
                        {user.fullName?.charAt(0) || '?'}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{user.fullName}</div>
                        <div className="text-gray-500 text-sm">{user.email}</div>
                      </div>
                    </label>
                  ))}
                  {availableUsers.length === 0 && (
                    <p className="text-gray-500 text-center py-4">No users available</p>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button
                onClick={() => {
                  setShowNewChat(false);
                  setSelectedUsers([]);
                  setGroupName('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateRoom}
                disabled={selectedUsers.length === 0}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                Start Chat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function formatTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 60) return `${minutes}m`;
  if (hours < 24) return `${hours}h`;
  return `${days}d`;
}
