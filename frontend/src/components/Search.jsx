import { useState, useEffect } from 'react';
import { searchMessages, searchAllMessages, searchUsers } from '../api/search.js';
import OnlineStatusIndicator from './OnlineStatusIndicator.jsx';

const Search = ({ currentUser, onSelectRoom, onSelectUser }) => {
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState('messages');
  const [results, setResults] = useState({ messages: [], users: [], allMessages: [] });
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const search = async (searchQuery, pageNum = 1) => {
    if (!searchQuery.trim()) {
      setResults({ messages: [], users: [], allMessages: [] });
      return;
    }

    setLoading(true);
    try {
      let searchResults = {};

      if (activeTab === 'messages') {
        // This would need roomId prop - for now search all messages
        searchResults.allMessages = await searchAllMessages(searchQuery, pageNum);
        setHasMore(searchResults.allMessages.pagination.page < searchResults.allMessages.pagination.pages);
      } else if (activeTab === 'users') {
        searchResults.users = await searchUsers(searchQuery, pageNum);
        setHasMore(searchResults.users.pagination.page < searchResults.users.pagination.pages);
      } else if (activeTab === 'all') {
        searchResults.allMessages = await searchAllMessages(searchQuery, pageNum);
        searchResults.users = await searchUsers(searchQuery, pageNum);
        setHasMore(
          searchResults.allMessages.pagination.page < searchResults.allMessages.pagination.pages ||
          searchResults.users.pagination.page < searchResults.users.pagination.pages
        );
      }

      if (pageNum === 1) {
        setResults(searchResults);
      } else {
        setResults(prev => ({
          messages: prev.messages,
          users: prev.users,
          allMessages: [...prev.allMessages, ...searchResults.allMessages?.messages || []]
        }));
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (query) {
        setPage(1);
        search(query, 1);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query, activeTab]);

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    search(query, nextPage);
  };

  const highlightText = (text, highlight) => {
    if (!highlight) return text;
    const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
    return parts.map((part, index) => 
      part.toLowerCase() === highlight.toLowerCase() ? 
        <mark key={index} className="bg-yellow-200">{part}</mark> : part
    );
  };

  const formatMessagePreview = (message) => {
    const roomName = message.room.isGroup ? message.room.name : 
      message.room.members.find(m => m._id !== currentUser._id)?.name || 'Direct Chat';
    
    return (
      <div key={message._id} className="search-result-item p-3 border-b hover:bg-gray-50 cursor-pointer"
           onClick={() => onSelectRoom && onSelectRoom(message.room)}>
        <div className="flex justify-between items-start mb-1">
          <span className="font-medium text-sm">{roomName}</span>
          <span className="text-xs text-gray-500">
            {new Date(message.createdAt).toLocaleDateString()}
          </span>
        </div>
        <div className="text-sm text-gray-600 mb-1">
          {message.sender.name}: {highlightText(message.text, query)}
        </div>
      </div>
    );
  };

  const formatUserResult = (user) => {
    return (
      <div key={user._id} className="search-result-item p-3 border-b hover:bg-gray-50 cursor-pointer flex items-center gap-3"
           onClick={() => onSelectUser && onSelectUser(user)}>
        <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
          {user.avatar ? (
            <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
          ) : (
            <span className="text-sm font-medium">{user.name.charAt(0).toUpperCase()}</span>
          )}
        </div>
        <div className="flex-1">
          <div className="font-medium">{highlightText(user.name, query)}</div>
          <div className="text-sm text-gray-500">{highlightText(user.email, query)}</div>
        </div>
        <OnlineStatusIndicator user={user} size="small" />
      </div>
    );
  };

  return (
    <div className="search-container">
      <div className="search-input-container">
        <input
          type="text"
          placeholder="Search messages, users..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {query && (
        <div className="search-tabs">
          <div className="flex border-b">
            <button
              className={`px-4 py-2 text-sm font-medium ${activeTab === 'all' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'}`}
              onClick={() => setActiveTab('all')}
            >
              All
            </button>
            <button
              className={`px-4 py-2 text-sm font-medium ${activeTab === 'messages' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'}`}
              onClick={() => setActiveTab('messages')}
            >
              Messages
            </button>
            <button
              className={`px-4 py-2 text-sm font-medium ${activeTab === 'users' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'}`}
              onClick={() => setActiveTab('users')}
            >
              Users
            </button>
          </div>
        </div>
      )}

      <div className="search-results">
        {loading && (
          <div className="p-4 text-center">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            <p className="text-sm text-gray-500 mt-2">Searching...</p>
          </div>
        )}

        {!loading && query && (
          <div>
            {activeTab === 'all' && (
              <div>
                {results.allMessages?.length > 0 && (
                  <div>
                    <h3 className="px-3 py-2 text-sm font-medium text-gray-700">Messages</h3>
                    {results.allMessages.map(formatMessagePreview)}
                  </div>
                )}
                {results.users?.length > 0 && (
                  <div>
                    <h3 className="px-3 py-2 text-sm font-medium text-gray-700">Users</h3>
                    {results.users.map(formatUserResult)}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'messages' && results.allMessages?.map(formatMessagePreview)}
            {activeTab === 'users' && results.users?.map(formatUserResult)}

            {!loading && results.allMessages?.length === 0 && results.users?.length === 0 && (
              <div className="p-4 text-center text-gray-500">
                No results found for "{query}"
              </div>
            )}

            {hasMore && !loading && (
              <div className="p-4 text-center">
                <button
                  onClick={loadMore}
                  className="px-4 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Load More
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Search;
