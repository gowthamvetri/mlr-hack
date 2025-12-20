import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../store/slices/authSlice';
import { getAllSeatingRooms, createSeatingRoom, updateSeatingRoom, deleteSeatingRoom } from '../../utils/api';
import DashboardLayout from '../../components/DashboardLayout';
import Modal from '../../components/Modal';
import { Building, Plus, Edit, Trash2, Search, MapPin, Users, Check, X, Layers, Sparkles, RefreshCw } from 'lucide-react';

const SeatingRooms = () => {
  const user = useSelector(selectCurrentUser);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddRoom, setShowAddRoom] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [rooms, setRooms] = useState([]);
  const [newRoom, setNewRoom] = useState({
    roomNumber: '', building: 'Main Block', floor: '1', capacity: 30, hallNo: ''
  });

  // Fetch rooms from database on mount
  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const { data } = await getAllSeatingRooms();
      setRooms(data || []);
    } catch (error) {
      console.error('Error fetching rooms:', error);
      alert('Error loading rooms: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const filteredRooms = rooms.filter(room =>
    room.roomNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    room.building?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    room.hallNo?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddRoom = async () => {
    if (!newRoom.roomNumber) return alert('Room number is required');
    if (!newRoom.capacity || newRoom.capacity <= 0) return alert('Valid capacity is required');

    setSaving(true);
    try {
      const { data } = await createSeatingRoom({
        roomNumber: newRoom.roomNumber,
        hallNo: newRoom.hallNo || `Room ${newRoom.roomNumber}`,
        building: newRoom.building,
        floor: newRoom.floor,
        capacity: parseInt(newRoom.capacity)
      });

      setRooms([...rooms, data]);
      setNewRoom({ roomNumber: '', building: 'Main Block', floor: '1', capacity: 30, hallNo: '' });
      setShowAddRoom(false);
      alert('Room created successfully!');
    } catch (error) {
      alert('Error creating room: ' + (error.response?.data?.message || error.message));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRoom = async (id) => {
    if (!confirm('Are you sure you want to delete this room?')) return;

    try {
      await deleteSeatingRoom(id);
      setRooms(rooms.filter(r => r._id !== id));
      alert('Room deleted successfully!');
    } catch (error) {
      alert('Error deleting room: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleUpdateRoom = async () => {
    if (!editingRoom.roomNumber) return alert('Room number is required');

    setSaving(true);
    try {
      const { data } = await updateSeatingRoom(editingRoom._id, {
        roomNumber: editingRoom.roomNumber,
        hallNo: editingRoom.hallNo,
        building: editingRoom.building,
        floor: editingRoom.floor,
        capacity: parseInt(editingRoom.capacity),
        isAvailable: editingRoom.isAvailable
      });

      setRooms(rooms.map(r => r._id === editingRoom._id ? data : r));
      setEditingRoom(null);
      alert('Room updated successfully!');
    } catch (error) {
      alert('Error updating room: ' + (error.response?.data?.message || error.message));
    } finally {
      setSaving(false);
    }
  };

  const getStatusColor = (isAvailable) => {
    return isAvailable
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
      : 'bg-red-50 text-red-700 border-red-200';
  };

  const totalCapacity = rooms.reduce((sum, r) => sum + (r.capacity || 0), 0);
  const availableRooms = rooms.filter(r => r.isAvailable !== false).length;

  return (
    <DashboardLayout role="seating_manager" userName={user?.name}>
      <div className="max-w-[1600px] mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Room Management</h1>
            <p className="text-zinc-500 mt-1 text-sm">Manage exam rooms and their configurations</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={fetchRooms}
              className="flex items-center gap-2 px-4 py-3 bg-white hover:bg-zinc-50 text-zinc-700 hover:text-zinc-900 border border-zinc-200 rounded-xl font-bold transition-all shadow-sm"
            >
              <RefreshCw className="w-5 h-5" />
              Refresh
            </button>
            <button
              onClick={() => setShowAddRoom(true)}
              className="flex items-center gap-2 px-6 py-3 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl font-bold shadow-lg shadow-zinc-200 transition-all"
            >
              <Plus className="w-5 h-5" />
              Add Room
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-5 border border-zinc-200 shadow-sm hover:border-violet-200 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-500 font-bold text-xs uppercase tracking-wide">Total Rooms</p>
                <p className="text-2xl font-bold text-zinc-900 mt-1">{rooms.length}</p>
              </div>
              <div className="w-10 h-10 bg-violet-50 border border-violet-100 rounded-xl flex items-center justify-center">
                <Building className="w-5 h-5 text-violet-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-5 border border-zinc-200 shadow-sm hover:border-emerald-200 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-500 font-bold text-xs uppercase tracking-wide">Available</p>
                <p className="text-2xl font-bold text-emerald-600 mt-1">{availableRooms}</p>
              </div>
              <div className="w-10 h-10 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-center">
                <Check className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-5 border border-zinc-200 shadow-sm hover:border-blue-200 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-500 font-bold text-xs uppercase tracking-wide">Total Capacity</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">{totalCapacity}</p>
              </div>
              <div className="w-10 h-10 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-5 border border-zinc-200 shadow-sm hover:border-orange-200 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-500 font-bold text-xs uppercase tracking-wide">Buildings</p>
                <p className="text-2xl font-bold text-orange-600 mt-1">{[...new Set(rooms.map(r => r.building))].length}</p>
              </div>
              <div className="w-10 h-10 bg-orange-50 border border-orange-100 rounded-xl flex items-center justify-center">
                <MapPin className="w-5 h-5 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-xl border border-zinc-200 p-5 shadow-sm">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 group-focus-within:text-violet-600 transition-colors" />
            <input
              type="text"
              placeholder="Search rooms by number, building, or hall name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all text-zinc-900 placeholder-zinc-400"
            />
          </div>
        </div>

        {/* Rooms Grid */}
        {loading ? (
          <div className="text-center py-24">
            <div className="w-16 h-16 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-zinc-500 font-bold">Loading rooms from database...</p>
          </div>
        ) : rooms.length === 0 ? (
          <div className="bg-white rounded-xl border border-zinc-200 p-16 text-center shadow-sm">
            <div className="w-20 h-20 bg-zinc-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-zinc-100">
              <Sparkles className="w-10 h-10 text-zinc-400" />
            </div>
            <p className="text-xl font-bold text-zinc-900">No rooms in database</p>
            <p className="text-zinc-500 mt-2">Click "Add Room" to create your first room</p>
          </div>
        ) : filteredRooms.length === 0 ? (
          <div className="bg-white rounded-xl border border-zinc-200 p-12 text-center shadow-sm">
            <Search className="w-12 h-12 mx-auto mb-3 text-zinc-300" />
            <p className="text-zinc-900 font-bold">No rooms found</p>
            <p className="text-zinc-500 text-sm">Try adjusting your search</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRooms.map(room => (
              <div key={room._id} className="bg-white rounded-xl border border-zinc-200 overflow-hidden hover:border-zinc-300 hover:shadow-md transition-all group">
                <div className={`h-1.5 ${room.isAvailable !== false ? 'bg-gradient-to-r from-emerald-500 to-emerald-600' : 'bg-gradient-to-r from-red-500 to-red-600'}`} />
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-zinc-50 border border-zinc-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Building className="w-6 h-6 text-zinc-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-zinc-900">{room.hallNo || `Room ${room.roomNumber}`}</h3>
                        <p className="text-sm text-zinc-500">{room.roomNumber}</p>
                      </div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusColor(room.isAvailable !== false)}`}>
                      {room.isAvailable !== false ? 'Available' : 'Unavailable'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-zinc-400" />
                      <span className="text-zinc-600">{room.building}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-zinc-400" />
                      <span className="text-zinc-600">Floor {room.floor}</span>
                    </div>
                    <div className="flex items-center gap-2 col-span-2">
                      <Users className="w-4 h-4 text-zinc-400" />
                      <span className="text-zinc-600">{room.capacity} seats</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end pt-4 border-t border-zinc-100">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setEditingRoom({ ...room })}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteRoom(room._id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Room Modal */}
      <Modal
        isOpen={showAddRoom || !!editingRoom}
        onClose={() => { setShowAddRoom(false); setEditingRoom(null); }}
        title={editingRoom ? 'Edit Room' : 'Add New Room'}
        size="md"
      >
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-zinc-700 mb-2">Room Number *</label>
              <input
                type="text"
                className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all text-zinc-900"
                value={editingRoom ? editingRoom.roomNumber : newRoom.roomNumber}
                onChange={(e) => editingRoom
                  ? setEditingRoom({ ...editingRoom, roomNumber: e.target.value })
                  : setNewRoom({ ...newRoom, roomNumber: e.target.value })
                }
                placeholder="e.g. 101"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-zinc-700 mb-2">Hall Name</label>
              <input
                type="text"
                className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all text-zinc-900"
                value={editingRoom ? editingRoom.hallNo : newRoom.hallNo}
                onChange={(e) => editingRoom
                  ? setEditingRoom({ ...editingRoom, hallNo: e.target.value })
                  : setNewRoom({ ...newRoom, hallNo: e.target.value })
                }
                placeholder="e.g. Hall A"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-zinc-700 mb-2">Building</label>
            <select
              className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all text-zinc-900"
              value={editingRoom ? editingRoom.building : newRoom.building}
              onChange={(e) => editingRoom
                ? setEditingRoom({ ...editingRoom, building: e.target.value })
                : setNewRoom({ ...newRoom, building: e.target.value })
              }
            >
              <option>Main Block</option>
              <option>Annex Block</option>
              <option>Science Block</option>
              <option>Engineering Block</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-zinc-700 mb-2">Floor</label>
              <input
                type="text"
                className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all text-zinc-900"
                value={editingRoom ? editingRoom.floor : newRoom.floor}
                onChange={(e) => editingRoom
                  ? setEditingRoom({ ...editingRoom, floor: e.target.value })
                  : setNewRoom({ ...newRoom, floor: e.target.value })
                }
                placeholder="1"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-zinc-700 mb-2">Capacity *</label>
              <input
                type="number"
                className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all text-zinc-900"
                value={editingRoom ? editingRoom.capacity : newRoom.capacity}
                onChange={(e) => editingRoom
                  ? setEditingRoom({ ...editingRoom, capacity: parseInt(e.target.value) || 0 })
                  : setNewRoom({ ...newRoom, capacity: parseInt(e.target.value) || 0 })
                }
                placeholder="30"
                min="1"
              />
            </div>
          </div>
          {editingRoom && (
            <div>
              <label className="block text-sm font-bold text-zinc-700 mb-2">Status</label>
              <select
                className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all text-zinc-900"
                value={editingRoom.isAvailable !== false ? 'true' : 'false'}
                onChange={(e) => setEditingRoom({ ...editingRoom, isAvailable: e.target.value === 'true' })}
              >
                <option value="true">Available</option>
                <option value="false">Unavailable</option>
              </select>
            </div>
          )}
        </div>
        <div className="mt-6 pt-4 border-t border-zinc-100 flex gap-3">
          <button
            onClick={() => { setShowAddRoom(false); setEditingRoom(null); }}
            className="px-6 py-3 bg-white hover:bg-zinc-50 text-zinc-600 hover:text-zinc-900 border border-zinc-200 rounded-xl font-bold transition-all"
          >
            Cancel
          </button>
          <button
            onClick={editingRoom ? handleUpdateRoom : handleAddRoom}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-100 disabled:text-zinc-400 text-white py-3 rounded-xl font-bold shadow-lg shadow-zinc-200 transition-all disabled:shadow-none"
          >
            {saving ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Check className="w-5 h-5" />
            )}
            {editingRoom ? 'Save Changes' : 'Add Room'}
          </button>
        </div>
      </Modal>
    </DashboardLayout>
  );
};

export default SeatingRooms;
