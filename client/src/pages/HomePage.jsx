import { useChatStore } from "../store/useChatStore";
import Sidebar from "../components/Sidebar";
import NoChatSelected from "../components/NoChatSelected";
import ChatContainer from "../components/ChatContainer";
import LeftNavPanel from "../components/LeftPanel";

const HomePage = () => {
  const { selectedUser } = useChatStore();

  return (
    <div className="h-screen bg-base-100 flex overflow-hidden">
      {/* Left Navigation Panel - Thin sidebar with icons */}
      <LeftNavPanel />

      {/* Chat List Sidebar */}
      <div className={`${selectedUser ? 'hidden lg:flex' : 'flex'} w-full lg:w-80 h-full border-r border-base-300`}>
        <Sidebar />
      </div>

      {/* Main Chat Area - Full remaining space */}
      <div className={`${selectedUser ? 'flex' : 'hidden lg:flex'} flex-1 h-full bg-base-100`}>
        {!selectedUser ? <NoChatSelected /> : <ChatContainer />}
      </div>
    </div>
  );
};
export default HomePage;
