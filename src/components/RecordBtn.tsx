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
  style={{
    width: "50px",
    height: "50px",
    borderRadius: "50%",
    border: "none",
    background: recording ? "#ff4d4f" : "#f1f1f1",
    color: recording ? "white" : "#333",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    animation: recording ? "pulse 1.2s infinite" : "none",
    justifyContent: "center",
    transition: "all 0.3s ease",
    boxShadow: recording
      ? "0 0 10px rgba(255, 77, 79, 0.6)"
      : "0 2px 6px rgba(0,0,0,0.1)",
  }}
>
  <FaMicrophone size={20} />
</button>
  );
}