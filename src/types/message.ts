export interface Message {
    id: string;
    content: string;
    senderId: string;
    receiverId: string;
    read: boolean;
    createdAt: string;
    updatedAt: string;
    sender?: {
        id: string;
        name: string;
        avatar?: string;
        email: string;
    };
}

export interface MessageResponse {
    data: Message[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}
