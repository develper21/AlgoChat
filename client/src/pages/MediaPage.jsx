import { useEffect, useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { axiosInstance } from "../lib/axios";
import { Image, Music, FileText, Download, Play } from "lucide-react";
import LeftNavPanel from "../components/LeftPanel";

const MediaPage = () => {
  const [mediaMessages, setMediaMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all"); // all, images, audio, files
  const { authUser } = useAuthStore();

  useEffect(() => {
    fetchMediaMessages();
  }, []);

  const fetchMediaMessages = async () => {
    try {
      const res = await axiosInstance.get("/messages/media");
      setMediaMessages(res.data);
    } catch (error) {
      console.error("Error fetching media:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter messages by type
  const filteredMessages = mediaMessages.filter((msg) => {
    if (activeTab === "all") return msg.image || msg.audio;
    if (activeTab === "images") return msg.image;
    if (activeTab === "audio") return msg.audio;
    return true;
  });

  const getMediaType = (msg) => {
    if (msg.image) return "image";
    if (msg.audio) return "audio";
    return "other";
  };

  if (isLoading) {
    return (
      <div className="flex h-screen bg-base-100">
        <LeftNavPanel />
        <div className="flex-1 flex items-center justify-center bg-base-100">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-base-100">
      <LeftNavPanel />
      <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-base-300 flex items-center gap-4 bg-base-200">
        <h1 className="text-xl font-bold">Shared Media</h1>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-base-300 bg-base-200/50">
        <button
          onClick={() => setActiveTab("all")}
          className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
            activeTab === "all"
              ? "text-primary border-b-2 border-primary bg-base-100"
              : "text-base-content/70 hover:bg-base-300"
          }`}
        >
          All
        </button>
        <button
          onClick={() => setActiveTab("images")}
          className={`flex-1 py-3 px-4 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
            activeTab === "images"
              ? "text-primary border-b-2 border-primary bg-base-100"
              : "text-base-content/70 hover:bg-base-300"
          }`}
        >
          <Image className="w-4 h-4" />
          Images
        </button>
        <button
          onClick={() => setActiveTab("audio")}
          className={`flex-1 py-3 px-4 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
            activeTab === "audio"
              ? "text-primary border-b-2 border-primary bg-base-100"
              : "text-base-content/70 hover:bg-base-300"
          }`}
        >
          <Music className="w-4 h-4" />
          Audio
        </button>
      </div>

      {/* Media Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-base-content/50">
            <FileText className="w-16 h-16 mb-4" />
            <p className="text-lg">No media files found</p>
            <p className="text-sm">Shared images and audio will appear here</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filteredMessages.map((msg) => {
              const type = getMediaType(msg);
              const isSender = msg.senderId === authUser._id;

              return (
                <div
                  key={msg._id}
                  className="relative group bg-base-200 rounded-xl overflow-hidden hover:shadow-lg transition-all"
                >
                  {type === "image" ? (
                    <>
                      <img
                        src={msg.image}
                        alt="Shared media"
                        className="w-full aspect-square object-cover"
                        loading="lazy"
                      />
                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <a
                          href={msg.image}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 bg-white/20 rounded-full hover:bg-white/40 transition-colors"
                          title="View"
                        >
                          <Play className="w-5 h-5 text-white" />
                        </a>
                        <a
                          href={msg.image}
                          download
                          className="p-2 bg-white/20 rounded-full hover:bg-white/40 transition-colors"
                          title="Download"
                        >
                          <Download className="w-5 h-5 text-white" />
                        </a>
                      </div>
                    </>
                  ) : type === "audio" ? (
                    <div className="p-4 flex flex-col items-center justify-center aspect-square">
                      <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-3">
                        <Music className="w-8 h-8 text-primary" />
                      </div>
                      <audio
                        src={msg.audio}
                        controls
                        className="w-full max-w-[120px]"
                      />
                      {msg.audioDuration && (
                        <span className="text-xs text-base-content/60 mt-2">
                          {Math.floor(msg.audioDuration / 60)}:{(msg.audioDuration % 60).toString().padStart(2, "0")}
                        </span>
                      )}
                    </div>
                  ) : null}

                  {/* Sender info */}
                  <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/70 to-transparent">
                    <p className="text-xs text-white/90">
                      {isSender ? "You" : "Received"}
                    </p>
                    <p className="text-[10px] text-white/60">
                      {new Date(msg.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        </div>
      </div>
    </div>
  );
};

export default MediaPage;
