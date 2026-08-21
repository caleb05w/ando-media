import {
  ChannelHeader,
  ChatMessage,
  Composer,
  GlobalNav,
  LocalNav,
  PinnedBar,
} from "./chat-shell";
import { InlineMultiSelect } from "./inline-multi-select";
import "./inline-multi-select.css";

function Transcript() {
  return (
    <div className="ims-transcript flex w-full shrink-0 flex-col items-start">
      <ChatMessage author="Tadao" time="5:36 PM">
        <p>Here’s what I can do!</p>
      </ChatMessage>

      <ChatMessage author="Tadao" time="5:36 PM">
        <div className="w-full py-1">
          <InlineMultiSelect />
        </div>
      </ChatMessage>
    </div>
  );
}

export default function InlineMultiSelectPage() {
  return (
    <div className="flex h-dvh w-screen overflow-hidden bg-white text-[#1a1817]">
      <GlobalNav />
      <LocalNav />
      <main className="relative flex min-w-0 flex-1 flex-col overflow-hidden bg-white">
        <ChannelHeader />
        <PinnedBar />
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto pr-4">
          <div aria-hidden="true" className="mt-auto shrink-0" />
          <Transcript />
        </div>
        <Composer />
      </main>
    </div>
  );
}
