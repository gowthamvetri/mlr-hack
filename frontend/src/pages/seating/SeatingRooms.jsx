import { useState } from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../store/slices/authSlice';
import DashboardLayout from '../../components/DashboardLayout';
import Modal from '../../components/Modal';
import { Building, Plus, Edit, Trash2, Search, MapPin, Users, Check, X } from 'lucide-react';

const SeatingRooms = () => {
  const user = useSelector(selectCurrentUser);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddRoom, setShowAddRoom] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [newRoom, setNewRoom] = useState({
    roomNumber: '', building: 'Main Block', floor: '1', capacity: 30, type: 'Classroom'
  });

  // Mock rooms data
  const [rooms, setRooms] = useState([
    { id: 1, roomNumber: '101', building: 'Main Block', floor: '1', capacity: 30, type: 'Classroom', status: 'Available' },
    { id: 2, roomNumber: '102', building: 'Main Block', floor: '1', capacity: 40, type: 'Classroom', status: 'Available' },
    { id: 3, roomNumber: '201', building: 'Main Block', floor: '2', capacity: 50, type: 'Lab', status: 'In Use' },
    { id: 4, roomNumber: '202', building: 'Main Block', floor: '2', capacity: 35, type: 'Classroom', status: 'Available' },
    { id: 5, roomNumber: 'A-101', building: 'Annex Block', floor: '1', capacity: 60, type: 'Seminar Hall', status: 'Available' },
    { id: 6, roomNumber: 'A-102', building: 'Annex Block', floor: '1', capacity: 45, type: 'Classroom', status: 'Maintenance' },
  ]);

  const filteredRooms = rooms.filter(room =>
    room.roomNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    room.building.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddRoom = () => {
    if (!newRoom.roomNumber) return alert('Room number is required');
    const newId = Math.max(...rooms.map(r => r.id)) + 1;
    setRooms([...rooms, { ...newRoom, id: newId, status: 'Available' }]);
    setNewRoom({ roomNumber: '', building: 'Main Block', floor: '1', capacity: 30, type: 'Classroom' });
    setShowAddRoom(false);
  };

  const handleDeleteRoom = (id) => {
    if (confirm('Are you sure you want to delete this room?')) {
      setRooms(rooms.filter(r => r.id !== id));
    }
  };

  const handleUpdateRoom = () => {
    if (!editingRoom.roomNumber) return alert('Room number is required');
    setRooms(rooms.map(r => r.id === editingRoom.id ? editingRoom : r));
    setEditingRoom(null);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Available': return 'bg-green-100 text-green-700';
      case 'In Use': return 'bg-blue-100 text-blue-700';
      case 'Maintenance': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'Classroom': return 'bg-blue-100 text-blue-700';
      case 'Lab': return 'bg-purple-100 text-purple-700';
      case 'Seminar Hall': return 'bg-orange-100 text-orange-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const totalCapacity = rooms.reduce((sum, r) => sum + r.capacity, 0);
  const availableRooms = rooms.filter(r => r.status === 'Available').length;

  return (
    <DashboardLayout role="seating_manager" userName={user?.name}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Room Management</h1>
          <p className="text-gray-500">Manage exam rooms and their configurations</p>
        </div>
        <button
          onClick={() => setShowAddRoom(true)}
          className="flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-semibold"
        >
          <Plus className="w-5 h-5" />
          Add Room
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Building className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{rooms.length}</p>
              <p className="text-sm text-gray-500">Total Rooms</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Check className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{availableRooms}</p>
              <p className="text-sm text-gray-500">Available</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{totalCapacity}</p>
              <p className="text-sm text-gray-500">Total Capacity</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <MapPin className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{new Set(rooms.map(r => r.building)).size}</p>
              <p className="text-sm text-gray-500">Buildings</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search rooms by number or building..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      {/* Rooms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRooms.map(room => (
          <div key={room.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                    <Building className="w-6 h-6 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-gray-800">Room {room.roomNumber}</h3>
                    <p className="text-sm text-gray-500">{room.building}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(room.status)}`}>
                  {room.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                <div>
                  <span className="text-gray-500">Floor:</span>
                  <span className="ml-2 font-medium">{room.floor}</span>
                </div>
                <div>
                  <span className="text-gray-500">Capacity:</span>
                  <span className="ml-2 font-medium">{room.capacity} seats</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <span className={`px-2 py-1 rounded text-xs font-medium ${getTypeColor(room.type)}`}>
                  {room.type}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEditingRoom(room)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteRoom(room.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredRooms.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <Building className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500 font-medium">No rooms found</p>
          <p className="text-gray-400 text-sm">Try adjusting your search</p>
        </div>
      )}

      {/* Add/Edit Room Modal */}
      <Modal
        isOpen={showAddRoom || !!editingRoom}
        onClose={() => { setShowAddRoom(false); setEditingRoom(null); }}
        title={editingRoom ? 'Edit Room' : 'Add New Room'}
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Room Number</label>
            <input
              type="text"
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500"
              value={editingRoom ? editingRoom.roomNumber : newRoom.roomNumber}
              onChange={(e) => editingRoom
                ? setEditingRoom({ ...editingRoom, roomNumber: e.target.value })
                : setNewRoom({ ...newRoom, roomNumber: e.target.value })
              }
              placeholder="e.g. 101"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Building</label>
            <select
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white"
              value={editingRoom ? editingRoom.building : newRoom.building}
              onChange={(e) => editingRoom
                ? setEditingRoom({ ...editingRoom, building: e.target.value })
                : setNewRoom({ ...newRoom, building: e.target.value })
              }
            >
              <option>Main Block</option>
              <option>Annex Block</option>
              <option>Science Block</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Floor</label>
              <input
                type="text"
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                value={editingRoom ? editingRoom.floor : newRoom.floor}
                onChange={(e) => editingRoom
                  ? setEditingRoom({ ...editingRoom, floor: e.target.value })
                  : setNewRoom({ ...newRoom, floor: e.target.value })
                }
                placeholder="1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
              <input
                type="number"
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                value={editingRoom ? editingRoom.capacity : newRoom.capacity}
                onChange={(e) => editingRoom
                  ? setEditingRoom({ ...editingRoom, capacity: parseInt(e.target.value) })
                  : setNewRoom({ ...newRoom, capacity: parseInt(e.target.value) })
                }
                placeholder="30"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white"
              value={editingRoom ? editingRoom.type : newRoom.type}
              onChange={(e) => editingRoom
                ? setEditingRoom({ ...editingRoom, type: e.target.value })
                : setNewRoom({ ...newRoom, type: e.target.value })
              }
            >
              <option>Classroom</option>
              <option>Lab</option>
              <option>Seminar Hall</option>
            </select>
          </div>
          {editingRoom && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white"
                value={editingRoom.status}
                onChange={(e) => setEditingRoom({ ...editingRoom, status: e.target.value })}
              >
                <option>Available</option>
                <option>In Use</option>
                <option>Maintenance</option>
              </select>
            </div>
          )}
        </div>
        <div className="mt-6 pt-4 border-t border-gray-100 flex gap-3">
          <button
            onClick={() => { setShowAddRoom(false); setEditingRoom(null); }}
            className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium"
          >
            Cancel
          </button>
          <button
            onClick={editingRoom ? handleUpdateRoom : handleAddRoom}
            className="flex-1 flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white py-3 rounded-lg font-medium"
          >
            <Check className="w-5 h-5" />
            {editingRoom ? 'Save Changes' : 'Add Room'}
          </button>
        </div>
      </Modal>
    </DashboardLayout>
  );
};

export default SeatingRooms;
