import { openState } from '@/recoil/atom/AtomSlideOver';
import {
  ChatBubbleLeftIcon,
  TrashIcon,
  PencilSquareIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import {
  collection,
  deleteDoc,
  doc,
  orderBy,
  query,
  updateDoc
} from 'firebase/firestore';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useCollection } from 'react-firebase-hooks/firestore';
import { useRecoilState, useSetRecoilState } from 'recoil';
import { db } from '../../service/firebase/firebase';
import {
  isChatEditState,
  oldChatIdState,
  currentChatIdState
} from '@/recoil/atom/AtomChat';
import { useI18n } from '@/hook/useI18n';

type ChatRowProps = {
  id: string;
  chatContentData: any;
};

function ChatRow({ id, chatContentData }: ChatRowProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const [active, setActive] = useState(false);
  const [chatContentTitle, setChatContentTitle] = useState('');

  const openStateChange = useSetRecoilState(openState);
  const [isChatEdit, setIsChatEdit] = useRecoilState(isChatEditState);
  const [oldChatId, setOldChatId] = useRecoilState(oldChatIdState);
  const setCurrentChatId = useSetRecoilState(currentChatIdState);

  const { t, locale } = useI18n();

  const [messages] = useCollection(
    query(
      collection(db, 'users', session?.user?.name!, 'chats', id, 'messages'),
      orderBy('createAt', 'asc')
    )
  );

  const conversation =
    messages?.docs[messages?.docs.length - 1]?.data().text ||
    'New Conversation';

  const chatContent: ChatContent = chatContentData?.docs
    .find((data: any) => data.id === id)
    ?.data();

  useEffect(() => {
    if (!pathname) {
      return;
    }
    setActive(pathname.includes(id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const removeChat = async () => {
    await deleteDoc(doc(db, 'users', session?.user?.name!, 'chats', id));
    router.replace('/');
  };

  const linkToChat = () => {
    setCurrentChatId(id);
    openStateChange(false);
  };

  const editChatTitle = (e: any) => {
    e.preventDefault();
    e.stopPropagation();
    setIsChatEdit(true);
    setOldChatId(id);
    setChatContentTitle(chatContent?.title || '');
  };

  const cancelEdit = (e: any) => {
    e.preventDefault();
    e.stopPropagation();
    setIsChatEdit(false);
  };

  const changeChatTitle = (e: any) => {
    e.preventDefault();
    e.stopPropagation();
    setChatContentTitle(e.target.value);
  };

  const saveContentTitle = () => {
    const chatContent = {
      title: chatContentTitle
    };
    updateDoc(doc(db, 'users', session?.user?.name!, 'chats', id), {
      ...chatContent
    }).then(() => {
      setIsChatEdit(false);
      setChatContentTitle('');
    });
  };

  return (
    <Link
      onClick={linkToChat}
      href={
        isChatEdit
          ? `/${locale()}/chat/${oldChatId}`
          : `/${locale()}/chat/${id}`
      }
      className={`chatRow ${active && 'bg-gray-700/50'}`}
    >
      <ChatBubbleLeftIcon className="h-5 w-5" />

      <div
        className={`relative flex-1 overflow-hidden break-all  ${
          oldChatId === id && isChatEdit ? 'max-h-12' : 'max-h-5'
        }`}
      >
        {active && isChatEdit ? (
          <>
            <input
              value={chatContentTitle}
              onClick={(e: any) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onChange={changeChatTitle}
              className="max-w-[125px] border border-white/50 bg-transparent text-sm"
              type="text"
            />
          </>
        ) : (
          <>{chatContent?.title || conversation}</>
        )}
      </div>

      <div className="flex text-gray-300">
        {active &&
          (!isChatEdit ? (
            <>
              <PencilSquareIcon
                onClick={editChatTitle}
                className="sideBar-icon"
              />
              <TrashIcon onClick={removeChat} className="sideBar-icon" />
            </>
          ) : (
            <>
              <CheckIcon onClick={saveContentTitle} className="sideBar-icon" />
              <XMarkIcon onClick={cancelEdit} className="sideBar-icon" />
            </>
          ))}
      </div>
    </Link>
  );
}

export default ChatRow;
