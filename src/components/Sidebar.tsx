// import React from "react";

// type Chat = {
//   chatId: string;
//   title?: string;
// };

// type SidebarProps = {
//   chats: Chat[];
//   currentChatId: string | null;
//   onSelectChat: (chatId: string) => void;
//   onNewChat: () => void;
// };

// const Sidebar: React.FC<SidebarProps> = ({
//   chats,
//   currentChatId,
//   onSelectChat,
//   onNewChat,
// }) => {
//   return (
//     <div className="w-72 bg-white border-r border-slate-200 flex flex-col h-screen">
      
//       {/* Header */}
//       <div className="p-4 border-b">
//         <button
//           onClick={onNewChat}
//           className="w-full bg-indigo-600 text-white py-2 rounded-lg font-semibold hover:bg-indigo-700 transition"
//         >
//           + New Chat
//         </button>
//       </div>

//       {/* Chat List */}
//       <div className="flex-1 overflow-y-auto">
//         {chats.length === 0 ? (
//           <p className="text-sm text-slate-400 p-4">No chats yet</p>
//         ) : (
//           chats.map((chat) => (
//             <div
//               key={chat.chatId}
//               onClick={() => onSelectChat(chat.chatId)}
//               className={`p-3 cursor-pointer border-b hover:bg-slate-100 transition ${
//                 chat.chatId === currentChatId
//                   ? "bg-indigo-50"
//                   : ""
//               }`}
//             >
//               <p className="text-sm font-medium text-slate-700 truncate">
//                 {chat.title || "New Chat"}
//               </p>
//             </div>
//           ))
//         )}
//       </div>

//       {/* Footer */}
//       <div className="p-4 border-t text-xs text-slate-400">
//         Smart Study Assistant
//       </div>
//     </div>
//   );
// };

// export default Sidebar;
import React from "react";
import { useState,useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2 } from "lucide-react";

import { Plus, MessageSquare, History, Settings, LogOut, User } from "lucide-react";

export type Chat = {
  chatId: string;
  title?: string;
  timestamp?: string;
};
type Document={
    name:string;
  _id:string;
  doc_id:string;
  uploadedAt:Date;
  fileHash:string;
}
type SidebarProps = {
  chats: Chat[];
  currentChatId: string | null;
  onSelectChat: (chatId: string) => void;
  onNewChat: () => void;
  documents:Document[];
  setDocuments: React.Dispatch<React.SetStateAction<Document[]>>;
};
import {userService} from "../services/api"
type User = {
  name: string;
  email: string;
};




const Sidebar: React.FC<SidebarProps> = ({
  chats,
  currentChatId,
  onSelectChat,
  onNewChat,
  documents,
  setDocuments
}) => {
    const navigate = useNavigate();
    const [user, setUser] = useState<User | null>(null);
    const handleLogout = () => {
        sessionStorage.removeItem('token');
        navigate('/login');
    };
    console.log("Documets:",documents);
    const fetchUser=async()=>{
        const userRes=await userService.getUser();
        if(!userRes){
            console.log("User Not Found");
        }
        const userData: User={
            "name":userRes.name,
            "email":userRes.email
        }
        setUser(userData);

        }
    useEffect(()=>{
        fetchUser()
    },[]);

    const deleteDocument = async (doc_id: string) => {
      if (!doc_id) {
        console.error("Invalid doc_id:", doc_id);
        alert("Error: Invalid document ID!");
        return;
      }

      const confirmed = window.confirm("Are you sure you want to delete this document?");
      if (!confirmed) return;

      try {
        const token = sessionStorage.getItem("token");
        const chatId = sessionStorage.getItem("chatId");
        if(!chatId){
          return alert("No active chat session found. Please select a chat session and try again.");
        }
        console.log("Deleting document with ID:", doc_id, "Chat ID:", chatId);
        const res = await fetch("http://localhost:5000/api/document/delete", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            ...(chatId ? { "x-chat-id": chatId } : {}),
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ doc_id }),
          
        });

        const data = await res.json();

        if (res.ok) {
          setDocuments((prev) =>
            prev.filter((doc) => doc.doc_id !== doc_id)
          );
        } else {
          console.error(data.message);
          alert("Failed to delete document: " + data.message);
        }
      } catch (err) {
        console.error("Delete failed", err);
        alert("Delete failed. Please try again.");
      }
    };



  return (
    <div className="w-80 bg-slate-50 border-r border-slate-200 flex flex-col h-screen shrink-0 relative transition-all duration-300">
      
      {/* App Header in Sidebar */}
      <div className="p-5 flex items-center gap-3">
        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-indigo-100">
          <History size={18} />
        </div>
        <span className="font-bold text-slate-800 tracking-tight">Study History</span>
      </div>

      {/* New Chat Button */}
      <div className="px-4 pb-4">
        <button
          onClick={onNewChat}
          className="w-full flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 py-3 rounded-xl font-semibold hover:border-indigo-300 hover:text-indigo-600 hover:shadow-sm transition-all active:scale-[0.98] group"
        >
          <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" />
          <span>New Chat</span>
        </button>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1 custom-scrollbar">
        <div className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          Recent Chats
        </div>
        
        {chats.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
               <MessageSquare size={20} className="text-slate-300" />
            </div>
            <p className="text-xs text-slate-400 font-medium">Your study sessions will appear here</p>
          </div>
        ) : (
          chats.map((chat) => (
            <button
              key={chat.chatId}
              onClick={() => onSelectChat(chat.chatId)}
              className={`w-full group flex items-center gap-3 px-3 py-3 rounded-xl transition-all text-left ${
                chat.chatId === currentChatId
                  ? "bg-white shadow-sm border border-slate-200 text-indigo-600 ring-1 ring-slate-100"
                  : "text-slate-600 hover:bg-slate-200/50"
              }`}
            >
              <MessageSquare 
                size={18} 
                className={chat.chatId === currentChatId ? "text-indigo-500" : "text-slate-400 group-hover:text-slate-500"} 
              />
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-medium truncate">
                  {chat.title || "Untitled Session"}
                </p>
                {chat.timestamp && (
                   <p className="text-[10px] text-slate-400 mt-0.5">{chat.timestamp}</p>
                )}
              </div>
            </button>
          ))
        )}

            <div className="px-4 py-2 text-xs text-slate-400">
        Uploaded Documents

        <div className="mt-1 space-y-1">
          {documents?.length > 0 ? (
            documents.map((doc: any) => (
              <div
                key={doc.doc_id}
                className="flex items-center justify-between text-xs text-slate-600 bg-slate-100 px-2 py-1 rounded group"
              >
                {/* File name */}
                <span className="truncate">{doc.name}</span>

                {/* Delete button */}
                <button
                  onClick={() => deleteDocument(doc.doc_id)}
                  className="opacity-0 group-hover:opacity-100 transition text-red-500 hover:text-red-700 ml-2"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          ) : (
            <div className="text-xs text-slate-400">No documents</div>
          )}
        </div>
        </div>
      </div>

      {/* Profile / Footer Section */}
      <div className="p-4 border-t border-slate-200 bg-white/50 space-y-2">
        {/* <button className="w-full flex items-center gap-3 px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors group">
          <Settings size={18} className="text-slate-400 group-hover:text-slate-600" />
          <span className="text-sm font-medium">Settings</span>
        </button>
         */}
        <div className="pt-2 flex items-center gap-3 px-3">
          <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold text-xs ring-2 ring-white">
            {user?user.name.trim()[0].toUpperCase():"U"}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-xs font-bold text-slate-800 truncate">{user?user.name:"User"}</p>
            <p className="text-[10px] text-slate-400 truncate">{user?user.email:"user@email.com"}</p>
          </div>
          <button className="p-2 text-slate-300 hover:text-rose-500 transition-colors">
            <LogOut size={18} onClick={handleLogout}/>
          </button>
        </div>
        
      </div>
    </div>
  );
};

export default Sidebar;
