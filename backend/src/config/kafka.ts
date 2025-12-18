import { Kafka, Producer, Consumer, Partitioners } from 'kafkajs';
import { env } from './env.js';

// Create Kafka client
const kafka = new Kafka({
    clientId: env.kafkaClientId,
    brokers: env.kafkaBrokers,
    retry: {
        initialRetryTime: 100,
        retries: 8,
    },
});

// Producer instance
let producer: Producer | null = null;

export const getProducer = async (): Promise<Producer> => {
    if (!producer) {
        producer = kafka.producer({
            createPartitioner: Partitioners.LegacyPartitioner,
        });
        await producer.connect();
        console.log('✅ Kafka producer connected');
    }
    return producer;
};

// Consumer factory
export const createConsumer = async (groupId: string): Promise<Consumer> => {
    const consumer = kafka.consumer({ groupId });
    await consumer.connect();
    console.log(`✅ Kafka consumer connected: ${groupId}`);
    return consumer;
};

// Topics
export const KAFKA_TOPICS = {
    EMAIL_QUEUE: 'email-queue',
    NOTIFICATION_QUEUE: 'notification-queue',
    AUDIT_LOG: 'audit-log',
} as const;

// Send message to Kafka
export const sendMessage = async (
    topic: string,
    message: Record<string, unknown>,
    key?: string
): Promise<void> => {
    const producer = await getProducer();
    await producer.send({
        topic,
        messages: [
            {
                key: key || undefined,
                value: JSON.stringify(message),
            },
        ],
    });
};

// Graceful shutdown
export const disconnectKafka = async (): Promise<void> => {
    if (producer) {
        await producer.disconnect();
        producer = null;
    }
};
