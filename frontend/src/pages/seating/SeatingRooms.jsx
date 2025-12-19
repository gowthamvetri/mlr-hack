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
      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
      : 'bg-red-500/10 text-red-400 border-red-500/20';
  };

  const totalCapacity = rooms.reduce((sum, r) => sum + (r.capacity || 0), 0);
  const availableRooms = rooms.filter(r => r.isAvailable !== false).length;

  return (
    <DashboardLayout role="seating_manager" userName={user?.name}>
      <div className="min-h-screen bg-dark-900 p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Room Management</h1>
            <p className="text-dark-400 mt-1 text-sm">Manage exam rooms and their configurations</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={fetchRooms}
              className="flex items-center gap-2 px-4 py-3 bg-dark-800 hover:bg-dark-700 text-dark-300 hover:text-white border border-dark-700 rounded-xl font-bold transition-all"
            >
              <RefreshCw className="w-5 h-5" />
              Refresh
            </button>
            <button
              onClick={() => setShowAddRoom(true)}
              className="flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-500 text-white rounded-xl font-bold shadow-lg shadow-primary-500/20 transition-all"
            >
              <Plus className="w-5 h-5" />
              Add Room
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl p-5 text-white shadow-lg shadow-primary-900/20 border border-primary-500/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-primary-100 font-bold text-xs uppercase tracking-wide">Total Rooms</p>
                <p className="text-2xl font-bold mt-1">{rooms.length}</p>
              </div>
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center border border-white/20">
                <Building className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
          <div className="glass-card-dark rounded-xl p-5 border border-dark-700 hover:border-emerald-500/30 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-dark-400 font-bold text-xs uppercase tracking-wide">Available</p>
                <p className="text-2xl font-bold text-emerald-400 mt-1">{availableRooms}</p>
              </div>
              <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center">
                <Check className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
          </div>
          <div className="glass-card-dark rounded-xl p-5 border border-dark-700 hover:border-primary-500/30 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-dark-400 font-bold text-xs uppercase tracking-wide">Total Capacity</p>
                <p className="text-2xl font-bold text-primary-400 mt-1">{totalCapacity}</p>
              </div>
              <div className="w-10 h-10 bg-primary-500/10 border border-primary-500/20 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-primary-400" />
              </div>
            </div>
          </div>
          <div className="glass-card-dark rounded-xl p-5 border border-dark-700 hover:border-orange-500/30 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-dark-400 font-bold text-xs uppercase tracking-wide">Buildings</p>
                <p className="text-2xl font-bold text-orange-400 mt-1">{[...new Set(rooms.map(r => r.building))].length}</p>
              </div>
              <div className="w-10 h-10 bg-orange-500/10 border border-orange-500/20 rounded-xl flex items-center justify-center">
                <MapPin className="w-5 h-5 text-orange-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="glass-card-dark rounded-xl border border-dark-700 p-5 mb-6">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500 group-focus-within:text-primary-400 transition-colors" />
            <input
              type="text"
              placeholder="Search rooms by number, building, or hall name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-dark-800 border border-dark-700 rounded-xl focus:bg-dark-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-white placeholder-dark-500"
            />
          </div>
        </div>

        {/* Rooms Grid */}
        {loading ? (
          <div className="text-center py-24">
            <div className="w-16 h-16 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-dark-400 font-bold">Loading rooms from database...</p>
          </div>
        ) : rooms.length === 0 ? (
          <div className="glass-card-dark rounded-xl border border-dark-700 p-16 text-center">
            <div className="w-20 h-20 bg-dark-800 rounded-full flex items-center justify-center mx-auto mb-4 border border-dark-700">
              <Sparkles className="w-10 h-10 text-dark-500" />
            </div>
            <p className="text-xl font-bold text-white">No rooms in database</p>
            <p className="text-dark-400 mt-2">Click "Add Room" to create your first room</p>
          </div>
        ) : filteredRooms.length === 0 ? (
          <div className="glass-card-dark rounded-xl border border-dark-700 p-12 text-center">
            <Search className="w-12 h-12 mx-auto mb-3 text-dark-500" />
            <p className="text-white font-bold">No rooms found</p>
            <p className="text-dark-400 text-sm">Try adjusting your search</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRooms.map(room => (
              <div key={room._id} className="glass-card-dark rounded-xl border border-dark-700 overflow-hidden hover:border-dark-600 hover:shadow-lg transition-all group">
                <div className={`h-1.5 ${room.isAvailable !== false ? 'bg-gradient-to-r from-emerald-500 to-emerald-600' : 'bg-gradient-to-r from-red-500 to-red-600'}`} />
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-primary-500/10 border border-primary-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Building className="w-6 h-6 text-primary-400" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-white">{room.hallNo || `Room ${room.roomNumber}`}</h3>
                        <p className="text-sm text-dark-400">{room.roomNumber}</p>
                      </div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusColor(room.isAvailable !== false)}`}>
                      {room.isAvailable !== false ? 'Available' : 'Unavailable'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-dark-500" />
                      <span className="text-dark-300">{room.building}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-dark-500" />
                      <span className="text-dark-300">Floor {room.floor}</span>
                    </div>
                    <div className="flex items-center gap-2 col-span-2">
                      <Users className="w-4 h-4 text-dark-500" />
                      <span className="text-dark-300">{room.capacity} seats</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end pt-4 border-t border-dark-700">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setEditingRoom({ ...room })}
                        className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteRoom(room._id)}
                        className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
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
              <label className="block text-sm font-bold text-dark-300 mb-2">Room Number *</label>
              <input
                type="text"
                className="w-full px-4 py-3 bg-dark-800 border border-dark-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-white"
                value={editingRoom ? editingRoom.roomNumber : newRoom.roomNumber}
                onChange={(e) => editingRoom
                  ? setEditingRoom({ ...editingRoom, roomNumber: e.target.value })
                  : setNewRoom({ ...newRoom, roomNumber: e.target.value })
                }
                placeholder="e.g. 101"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-dark-300 mb-2">Hall Name</label>
              <input
                type="text"
                className="w-full px-4 py-3 bg-dark-800 border border-dark-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-white"
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
            <label className="block text-sm font-bold text-dark-300 mb-2">Building</label>
            <select
              className="w-full px-4 py-3 bg-dark-800 border border-dark-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-white"
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
              <label className="block text-sm font-bold text-dark-300 mb-2">Floor</label>
              <input
                type="text"
                className="w-full px-4 py-3 bg-dark-800 border border-dark-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-white"
                value={editingRoom ? editingRoom.floor : newRoom.floor}
                onChange={(e) => editingRoom
                  ? setEditingRoom({ ...editingRoom, floor: e.target.value })
                  : setNewRoom({ ...newRoom, floor: e.target.value })
                }
                placeholder="1"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-dark-300 mb-2">Capacity *</label>
              <input
                type="number"
                className="w-full px-4 py-3 bg-dark-800 border border-dark-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-white"
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
              <label className="block text-sm font-bold text-dark-300 mb-2">Status</label>
              <select
                className="w-full px-4 py-3 bg-dark-800 border border-dark-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-white"
                value={editingRoom.isAvailable !== false ? 'true' : 'false'}
                onChange={(e) => setEditingRoom({ ...editingRoom, isAvailable: e.target.value === 'true' })}
              >
                <option value="true">Available</option>
                <option value="false">Unavailable</option>
              </select>
            </div>
          )}
        </div>
        <div className="mt-6 pt-4 border-t border-dark-700 flex gap-3">
          <button
            onClick={() => { setShowAddRoom(false); setEditingRoom(null); }}
            className="px-6 py-3 bg-dark-800 hover:bg-dark-700 text-dark-300 hover:text-white border border-dark-700 rounded-xl font-bold transition-all"
          >
            Cancel
          </button>
          <button
            onClick={editingRoom ? handleUpdateRoom : handleAddRoom}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-500 disabled:bg-dark-700 text-white py-3 rounded-xl font-bold shadow-lg shadow-primary-500/20 transition-all disabled:shadow-none disabled:text-dark-500"
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
