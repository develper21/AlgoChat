import { useMemo, useState } from 'react';

const getRoomTitle = (room, currentUser) => {
  if (room.isGroup) return room.name;
  const otherMember = room.members?.find((member) => member._id !== currentUser?._id);
  return otherMember?.name || 'Direct Chat';
};

const Sidebar = ({ rooms, selectedRoom, onSelectRoom, onCreateRoom, user, isLoading }) => {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ isGroup: false, name: '', members: '' });
  const [searchTerm, setSearchTerm] = useState('');

  const directRooms = useMemo(() => rooms.filter((room) => !room.isGroup), [rooms]);
  const groupRooms = useMemo(() => rooms.filter((room) => room.isGroup), [rooms]);

  const filterBySearch = (roomList) =>
    roomList.filter((room) =>
      getRoomTitle(room, user).toLowerCase().includes(searchTerm.toLowerCase())
    );

  const filteredDirectRooms = useMemo(
    () => filterBySearch(directRooms),
    [directRooms, searchTerm]
  );
  const filteredGroupRooms = useMemo(
    () => filterBySearch(groupRooms),
    [groupRooms, searchTerm]
  );

  const collaboratorCount = useMemo(() => {
    const ids = new Set();
    rooms.forEach((room) => {
      room.members?.forEach((member) => ids.add(member._id));
    });
    return ids.size;
  }, [rooms]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const memberEmails = form.members
      .split(',')
      .map((email) => email.trim())
      .filter(Boolean);

    await onCreateRoom({
      isGroup: form.isGroup,
      name: form.isGroup ? form.name : undefined,
      memberEmails
    });

    setForm({ isGroup: false, name: '', members: '' });
    setShowForm(false);
  };

  const renderRoom = (room) => {
    const title = getRoomTitle(room, user);
    const initial = title?.charAt(0)?.toUpperCase() || 'C';
    const subLabel = room.isGroup ? `${room.members.length} members` : 'Direct partner';

    return (
      <button
        type="button"
        key={room._id}
        className={`room-button ${selectedRoom?._id === room._id ? 'active' : ''}`}
        onClick={() => onSelectRoom(room)}
      >
        <div className="room-leading">
          <span className="room-avatar-badge">{initial}</span>
          <div>
            <p>{title}</p>
            <small>{subLabel}</small>
          </div>
        </div>
        <span className="room-time">
          {room.lastMessageAt ? new Date(room.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
        </span>
      </button>
    );
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div>
          <p className="eyebrow">Engagement Rooms</p>
          <h2>Dialogues</h2>
        </div>
        <div className="sidebar-header-actions">
          <button type="button" className="ghost" onClick={() => setShowForm((prev) => !prev)}>
            {showForm ? 'Close' : 'New Chat'}
          </button>
        </div>
      </div>

      <div className="sidebar-stats">
        <div>
          <span>Active Rooms</span>
          <strong>{rooms.length}</strong>
        </div>
        <div>
          <span>Collaborators</span>
          <strong>{collaboratorCount}</strong>
        </div>
      </div>

      <div className="sidebar-search">
        <input
          type="text"
          placeholder="Search people, collectives, initiatives..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {showForm && (
        <form className="room-form" onSubmit={handleSubmit}>
          <label htmlFor="room-type">
            Room type
            <select
              id="room-type"
              value={form.isGroup ? 'group' : 'direct'}
              onChange={(e) => setForm((prev) => ({ ...prev, isGroup: e.target.value === 'group' }))}
            >
              <option value="direct">Direct</option>
              <option value="group">Group</option>
            </select>
          </label>
          {form.isGroup && (
            <label htmlFor="room-name">
              Group name
              <input
                id="room-name"
                type="text"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                required
              />
            </label>
          )}
          <label htmlFor="room-members">
            Member emails (comma separated)
            <input
              id="room-members"
              type="text"
              value={form.members}
              placeholder="user@example.com"
              onChange={(e) => setForm((prev) => ({ ...prev, members: e.target.value }))}
              required
            />
          </label>
          <button type="submit">Create</button>
        </form>
      )}

      <section className="room-section">
        <h3>Direct</h3>
        {isLoading && <p className="muted">Loading…</p>}
        {!isLoading && filteredDirectRooms.length === 0 && <p className="muted">No direct chats</p>}
        {filteredDirectRooms.map(renderRoom)}
      </section>

      <section className="room-section">
        <h3>Groups</h3>
        {!isLoading && filteredGroupRooms.length === 0 && <p className="muted">No group chats</p>}
        {filteredGroupRooms.map(renderRoom)}
      </section>
    </aside>
  );
};

export default Sidebar;
