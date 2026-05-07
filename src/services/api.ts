import axios from 'axios';




/**
 * BACKEND CONNECTION CONFIGURATION
 * 
 * 1. Change baseURL to your actual backend API URL (e.g., 'https://api.yourdomain.com')
 * 2. If your backend is on the same domain, keep it as '/api' or your base path.
 */

const api = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL, // <--- UPDATE THIS TO YOUR BACKEND URL
 
  
});

api.interceptors.request.use((config) => {

  const token = sessionStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});


export interface Message {
  role: 'user' | 'assistant';
  content: string;
  _id?: string;
  timestamp?:Date;

}

export interface Suggestion {
  type: 'quiz';
  message: string;
  topic: string;
}

export type AnswerItem = string | QuizQuestion | Record<string, unknown>;

export interface AskResponse {
  answer: AnswerItem[] | AnswerItem;
  confidence: 'low' | 'medium' | 'high';
  topic: string;
  weakTopic: boolean;
  suggestion: Suggestion | null;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  answerIndex: number;
}

export interface QuizResponse {
  questions: QuizQuestion[];
}

export interface QuizSubmitRequest {
  topic: string;
  answers: number[];
  questions: { answerIndex: number }[];
}

export interface QuizSubmitResponse {
  score: number;
  total: number;
}
export interface Chats {
  _id:string;
  chatId:string;
  documents: ChatDocument[];
  title:string;
  updatedAt:Date;
}
export interface ChatDocument{
  name:string;
  _id:string;
  doc_id:string;
  uploadedAt:Date;
  fileHash:string;
}

export interface IngestResponse {
  status: string;
  message: string;
}

export interface ChatMessages {
  messages: Message[];
  documents: ChatDocument[];

}
export interface User {
  _id:string;
  createdAt:Date;
  updatedAt:Date;
  name:string;
  email:string;
  _v:number

}

export const chatService = {
  /**
   * CHAT API INTEGRATION
   * Endpoint: POST /api/ask
   */
  ask: async (question: string, chatHistory: Message[], chatId: string | null): Promise<AskResponse> => {
    const response = await api.post<AskResponse>('/ask', { // <--- UPDATE ENDPOINT PATH IF NEEDED
      question,
      chat_history: chatHistory,
      
    },
    {
      headers: {
        'Content-Type': 'application/json',
        "x-chat-id":chatId
      },
      
    });
    return response.data;
  },
};

export const chatHistoryService = {
  /**
   * CHAT HISTORY API INTEGRATION
   * Endpoint: GET /api/chat/history/{$chatId}
   */
  getHistory: async (chatId: string): Promise<ChatMessages> => {
    const response = await api.get<ChatMessages>(`/chat/history/${chatId}`); // <--- UPDATE ENDPOINT PATH IF NEEDED
    return response.data;
  },
};

export const chatSessionService = {
  /**
   * CREATE NEW CHAT SESSION
   * Endpoint: POST /api/chat/create
   */
  createChat: async (): Promise<{ chatId: string }> => {
    
    const response = await api.post<{ chatId?: string; newChat?: { chatId: string } }>('/chat/create', {
      headers: {
        'Content-Type': 'application/json',

        
      },
    });

    return {
      chatId: response.data.chatId ?? response.data.newChat?.chatId ?? '',
    };
  },

  /**
   * LOAD EXISTING CHAT SESSION
   * Endpoint: GET /api/chat/{chatId}
   */
  loadChat: async (chatId: string): Promise<ChatMessages> => {
    const response = await api.get<ChatMessages>(`/chat/${chatId}`);
    return response.data;
  },
  findChats:async (token:string):Promise<Chats[]>=>{
    const res = await api.get<Chats[]>(`/chat`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
    return res.data;
  }
  
  
};

export const userService={
  getUser:async ():Promise<User>=>{
    const response=await api.get<User>(`/user`);
    return response.data
  }
}

export const ingestService = {
  /**
   * PDF INGESTION API INTEGRATION
   * Endpoint: POST /api/ingest
   * Payload: FormData with 'file' field
   */
  uploadFile: async (file: File,chatId:string): Promise<IngestResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    console.log("sending chat id " ,chatId);
    
    const response = await api.post("/document/ingest", formData, {
    headers: {
      "x-chat-id": chatId  ,
     
    },
  });
    return response.data;
  },
};

export const quizService = {
  /**
   * QUIZ GENERATION API INTEGRATION
   * Endpoint: POST /api/quiz
   */
  getQuiz: async (topic: string, difficulty: string = 'easy'): Promise<QuizResponse> => {
    const response = await api.post<QuizResponse>('/quiz/generate', { // <--- UPDATE ENDPOINT PATH IF NEEDED
      topic,
      difficulty,
    });
    return response.data;
  },

  /**
   * QUIZ SUBMISSION API INTEGRATION
   * Endpoint: POST /api/quiz/submit
   */
  submitQuiz: async (data: QuizSubmitRequest): Promise<QuizSubmitResponse> => {
    const response = await api.post<QuizSubmitResponse>('/quiz/submit', data); // <--- UPDATE ENDPOINT PATH IF NEEDED
    return response.data;
  },
};

export default api;
