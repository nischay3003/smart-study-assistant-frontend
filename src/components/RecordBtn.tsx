import { useState, useRef } from "react";
import {FaMicrophone} from "react-icons/fa";

export default function VoiceInput({ setQuestion, handleSubmit }) {
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });

        const formData = new FormData();
        formData.append("file", audioBlob);

        try {
          const res = await fetch("http://localhost:8000/speech-to-text", {
            method: "POST",
            body: formData,
          });

          const data = await res.json();

          console.log("Transcribed text:", data.text);

          setQuestion(data.text);

          
          if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
          }

        } catch (err) {
          console.error("Upload error:", err);
        }
      };

      mediaRecorder.start();
      setRecording(true);

    } catch (err) {
      console.error("Mic access error:", err);
      alert("Please allow microphone access");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();

      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }


      setRecording(false);
    }
  };

  return (
    <button
  onClick={recording ? stopRecording : startRecording}
  className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all
    ${
      recording
        ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-200'
        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
    }
  `}
>
  <FaMicrophone size={18} />
  </button>
  );
}