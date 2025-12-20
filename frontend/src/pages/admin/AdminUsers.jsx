import { useState, useMemo, useRef, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../store/slices/authSlice';
import DashboardLayout from '../../components/DashboardLayout';
import { useGetUsersQuery, useDeleteUserMutation } from '../../services/api';
import { useAppDispatch } from '../../store';
import { showSuccessToast, showErrorToast } from '../../store/slices/uiSlice';
import gsap from 'gsap';
import { Users, Search, Filter, UserPlus, Edit, Trash2, Shield, GraduationCap, Building, Calendar, Loader2, X, RefreshCw, Sparkles } from 'lucide-react';

// Animated Counter
const AnimatedNumber = ({ value }) => {
  const [displayValue, setDisplayValue] = useState(0);
  const prevValue = useRef(0);

  useEffect(() => {
    const end = typeof value === 'number' ? value : 0;
    const start = prevValue.current;
    const duration = 400;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(start + (end - start) * eased));
      if (progress < 1) requestAnimationFrame(animate);
      else prevValue.current = end;
    };
    requestAnimationFrame(animate);
  }, [value]);

  return <span className="tabular-nums">{displayValue}</span>;
};

// Skeleton
const SkeletonPulse = ({ className }) => (
  <div className={`animate-pulse bg-zinc-200 rounded ${className}`} />
);

const AdminUsers = () => {
  const user = useSelector(selectCurrentUser);
  const dispatch = useAppDispatch();
  const pageRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const { data: users = [], isLoading, isFetching, isError, refetch } = useGetUsersQuery({
    role: filterRole !== 'all' ? filterRole : undefined,
    search: debouncedSearch || undefined
  });

  const [deleteUser, { isLoading: isDeleting }] = useDeleteUserMutation();

  useMemo(() => {
    const timeoutId = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  useEffect(() => {
    if (pageRef.current && !isLoading) {
      const ctx = gsap.context(() => {
        gsap.fromTo('.hero-section', { opacity: 0, y: -16 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' });
        gsap.fromTo('.insight-panel', { opacity: 0, y: 20, scale: 0.98 }, { opacity: 1, y: 0, scale: 1, duration: 0.5, stagger: 0.08, ease: 'power2.out', delay: 0.15 });
        gsap.fromTo('.filter-bar', { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out', delay: 0.3 });
      }, pageRef);
      return () => ctx.revert();
    }
  }, [isLoading]);

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await deleteUser(userId).unwrap();
        dispatch(showSuccessToast('User deleted successfully'));
      } catch (error) {
        dispatch(showErrorToast(error.message || 'Error deleting user'));
      }
    }
  };

  const roles = ['all', 'Student', 'Admin', 'SeatingManager', 'ClubCoordinator'];

  const getRoleIcon = (role) => {
    switch (role) {
      case 'Admin': return Shield;
      case 'Student': return GraduationCap;
      case 'SeatingManager': return Building;
      case 'ClubCoordinator': return Calendar;
      default: return Users;
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'Admin': return { bg: 'bg-red-50', text: 'text-red-600', icon: 'text-red-500' };
      case 'Student': return { bg: 'bg-blue-50', text: 'text-blue-600', icon: 'text-blue-500' };
      case 'SeatingManager': return { bg: 'bg-violet-50', text: 'text-violet-600', icon: 'text-violet-500' };
      case 'ClubCoordinator': return { bg: 'bg-emerald-50', text: 'text-emerald-600', icon: 'text-emerald-500' };
      default: return { bg: 'bg-zinc-100', text: 'text-zinc-600', icon: 'text-zinc-500' };
    }
  };

  const studentCount = users.filter(u => u.role === 'Student').length;
  const adminCount = users.filter(u => u.role === 'Admin').length;
  const managerCount = users.filter(u => u.role === 'SeatingManager').length;
  const coordinatorCount = users.filter(u => u.role === 'ClubCoordinator').length;

  const hasActiveFilters = searchQuery || filterRole !== 'all';
  const clearFilters = () => { setSearchQuery(''); setFilterRole('all'); };

  // Loading skeleton
  if (isLoading) {
    return (
      <DashboardLayout role="admin" userName={user?.name}>
        <div className="max-w-[1400px] mx-auto space-y-6">
          <SkeletonPulse className="h-28 rounded-2xl" />
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <SkeletonPulse key={i} className="h-24 rounded-xl" />)}
          </div>
          <SkeletonPulse className="h-16 rounded-xl" />
          <SkeletonPulse className="h-64 rounded-xl" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="admin" userName={user?.name}>
      <div ref={pageRef} className="space-y-6 max-w-[1400px] mx-auto">

        {/* ================================================================
            HERO SECTION - User summary with role breakdown
            ================================================================ */}
        <div className="hero-section relative overflow-hidden rounded-2xl bg-white p-6 lg:p-8 border border-zinc-200 shadow-sm">
          <div className="absolute top-0 right-0 w-72 h-72 bg-violet-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-xl lg:text-2xl font-semibold text-zinc-900 mb-1.5 tracking-tight">
                {users.length} System Users
              </h1>
              <p className="text-zinc-500 text-sm">
                {studentCount} students • {adminCount} admins • {managerCount} managers • {coordinatorCount} coordinators
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <button onClick={() => refetch()} disabled={isFetching} className="flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-zinc-600 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-all disabled:opacity-50">
                <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
              <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 rounded-lg transition-all shadow-lg shadow-violet-600/20">
                <UserPlus className="w-4 h-4" />Add User
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Students', value: studentCount, icon: GraduationCap, color: 'blue' },
            { label: 'Admins', value: adminCount, icon: Shield, color: 'red' },
            { label: 'Seating Managers', value: managerCount, icon: Building, color: 'violet' },
            { label: 'Coordinators', value: coordinatorCount, icon: Calendar, color: 'emerald' },
          ].map((stat, i) => {
            const colorMap = { blue: 'bg-blue-50 text-blue-600', red: 'bg-red-50 text-red-600', violet: 'bg-violet-50 text-violet-600', emerald: 'bg-emerald-50 text-emerald-600' };
            return (
              <div key={i} className="insight-panel group bg-white rounded-xl p-5 border border-zinc-100 hover:border-zinc-200 hover:shadow-sm transition-all duration-300">
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-9 h-9 rounded-lg ${colorMap[stat.color].split(' ')[0]} flex items-center justify-center`}>
                    <stat.icon className={`w-4.5 h-4.5 ${colorMap[stat.color].split(' ')[1]}`} strokeWidth={1.5} />
                  </div>
                </div>
                <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-1">{stat.label}</p>
                <p className="text-2xl font-semibold text-zinc-900"><AnimatedNumber value={stat.value} /></p>
              </div>
            );
          })}
        </div>

        {/* Filter Bar */}
        <div className="bg-white rounded-xl border border-zinc-200 p-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" strokeWidth={1.5} />
              <input type="text" placeholder="Search users..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2.5 text-sm bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500/50 transition-all text-zinc-900 placeholder-zinc-400" />
            </div>
            <div className="flex items-center gap-3">
              {roles.map(role => (
                <button key={role} onClick={() => setFilterRole(role)} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${filterRole === role ? 'bg-zinc-900 text-white shadow-sm' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'}`}>
                  {role === 'all' ? 'All' : role === 'SeatingManager' ? 'Seating' : role === 'ClubCoordinator' ? 'Club' : role}
                </button>
              ))}
              {hasActiveFilters && (
                <button onClick={clearFilters} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-violet-600 bg-violet-50 rounded-full hover:bg-violet-100 transition-colors border border-violet-100">
                  <X className="w-3 h-3" />Clear
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden relative">
          {isFetching && !isLoading && (
            <div className="absolute inset-0 bg-white/60 flex items-center justify-center z-10 backdrop-blur-[1px]">
              <Loader2 className="w-5 h-5 text-violet-600 animate-spin" />
            </div>
          )}

          {isLoading ? (
            <div className="p-12 text-center">
              <Loader2 className="w-6 h-6 text-violet-600 animate-spin mx-auto mb-3" />
              <p className="text-sm text-zinc-500">Loading users...</p>
            </div>
          ) : isError ? (
            <div className="p-12 text-center">
              <p className="text-sm text-red-500">Failed to load users. Please try again.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-zinc-100">
                    <th className="px-6 py-3 text-left text-[10px] font-medium text-zinc-400 uppercase tracking-wide">User</th>
                    <th className="px-6 py-3 text-left text-[10px] font-medium text-zinc-400 uppercase tracking-wide">Role</th>
                    <th className="px-6 py-3 text-left text-[10px] font-medium text-zinc-400 uppercase tracking-wide">Department</th>
                    <th className="px-6 py-3 text-left text-[10px] font-medium text-zinc-400 uppercase tracking-wide">Joined</th>
                    <th className="px-6 py-3 text-right text-[10px] font-medium text-zinc-400 uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50">
                  {users.map((u) => {
                    const roleColors = getRoleColor(u.role);
                    const RoleIcon = getRoleIcon(u.role);
                    return (
                      <tr key={u._id} className="hover:bg-zinc-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-violet-50 rounded-full flex items-center justify-center text-violet-600 font-medium text-sm">
                              {u.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium text-zinc-900 text-sm">{u.name}</p>
                              <p className="text-xs text-zinc-500">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border border-transparent ${roleColors.bg} ${roleColors.text}`}>
                            <RoleIcon className={`w-3 h-3 ${roleColors.icon}`} strokeWidth={1.5} />{u.role}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-zinc-600">{u.department || u.clubName || '-'}{u.year && ` • Year ${u.year}`}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs text-zinc-500">{new Date(u.createdAt).toLocaleDateString()}</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button className="p-2 text-zinc-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                              <Edit className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDeleteUser(u._id)} disabled={isDeleting} className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {users.length === 0 && (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 mx-auto mb-3 text-zinc-300" />
                  <p className="text-sm font-medium text-zinc-500">No users found</p>
                  <p className="text-xs text-zinc-400">Try adjusting your filters</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Results Count */}
        {users.length > 0 && (
          <div className="text-center">
            <p className="text-xs text-zinc-500">Showing <span className="font-medium text-zinc-900">{users.length}</span> users</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminUsers;
