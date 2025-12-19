import { useState, useRef, useEffect } from 'react';
import gsap from 'gsap';
import {
    Search, X, ChevronDown, ChevronUp, Building, Calendar,
    GraduationCap, Sparkles, Filter, Grid3X3, List, Hash, SlidersHorizontal
} from 'lucide-react';

// ============================================================================
// PREMIUM FILTER BAR - Collapsible Design
// Hidden by default, revealed on filter button click
// ============================================================================

// Mini Badge with pulse effect
const CountBadge = ({ count, active = false }) => (
    <span className={`
    inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold rounded-full
    transition-all duration-300 transform
    ${active
            ? 'bg-white text-violet-600 scale-110'
            : 'bg-zinc-200/60 text-zinc-500 group-hover:bg-violet-100 group-hover:text-violet-600'
        }
  `}>
        {count}
    </span>
);

// Interactive Filter Chip with hover glow
const FilterChip = ({ label, icon: Icon, active, onClick, count, color = 'violet' }) => {
    const colorStyles = {
        violet: { active: 'bg-violet-600 text-white shadow-lg shadow-violet-500/25', hover: 'hover:border-violet-300 hover:bg-violet-50' },
        blue: { active: 'bg-blue-600 text-white shadow-lg shadow-blue-500/25', hover: 'hover:border-blue-300 hover:bg-blue-50' },
        emerald: { active: 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/25', hover: 'hover:border-emerald-300 hover:bg-emerald-50' },
        amber: { active: 'bg-amber-600 text-white shadow-lg shadow-amber-500/25', hover: 'hover:border-amber-300 hover:bg-amber-50' },
        zinc: { active: 'bg-zinc-900 text-white shadow-lg shadow-zinc-500/25', hover: 'hover:border-zinc-300 hover:bg-zinc-50' },
        red: { active: 'bg-red-600 text-white shadow-lg shadow-red-500/25', hover: 'hover:border-red-300 hover:bg-red-50' },
    };
    const styles = colorStyles[color] || colorStyles.violet;

    return (
        <button
            onClick={onClick}
            className={`
        group relative flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium
        border transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]
        ${active
                    ? `${styles.active} border-transparent`
                    : `bg-white border-zinc-200 text-zinc-700 ${styles.hover}`
                }
      `}
        >
            {Icon && <Icon className={`w-3.5 h-3.5 transition-transform duration-300 ${active ? '' : 'group-hover:rotate-12'}`} />}
            <span>{label}</span>
            {count !== undefined && <CountBadge count={count} active={active} />}

            {/* Subtle glow on hover */}
            <div className={`
        absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300
        ${active ? '' : 'bg-gradient-to-r from-violet-500/5 via-transparent to-violet-500/5'}
      `} />
        </button>
    );
};

// ============================================================================
// FILTER TRIGGER BUTTON - Shows in header/toolbar
// ============================================================================
export const FilterTriggerButton = ({
    isOpen,
    onClick,
    activeFiltersCount = 0,
    className = ""
}) => {
    return (
        <button
            onClick={onClick}
            className={`
                group relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium
                border transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]
                ${isOpen
                    ? 'bg-violet-600 text-white border-violet-600 shadow-lg shadow-violet-500/25'
                    : 'bg-white border-zinc-200 text-zinc-700 hover:border-violet-300 hover:bg-violet-50'
                }
                ${className}
            `}
        >
            <Filter className={`w-4 h-4 transition-transform duration-300 ${isOpen ? 'rotate-180' : 'group-hover:rotate-12'}`} />
            <span>Filters</span>
            {activeFiltersCount > 0 && (
                <span className={`
                    inline-flex items-center justify-center min-w-[20px] h-[20px] px-1.5 text-[10px] font-bold rounded-full
                    ${isOpen ? 'bg-white text-violet-600' : 'bg-violet-100 text-violet-600'}
                `}>
                    {activeFiltersCount}
                </span>
            )}
            {isOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
    );
};

// ============================================================================
// COLLAPSIBLE FILTER PANEL - Main Component
// ============================================================================
export const PremiumFilterBar = ({
    isOpen = false,
    onClose,

    searchQuery,
    setSearchQuery,
    searchPlaceholder = "Search...",

    // Department filter
    departments = [],
    filterDept,
    setFilterDept,
    deptCounts = {},

    // Year filter
    years = [],
    filterYear,
    setFilterYear,
    yearCounts = {},

    // Semester filter (optional)
    semesters = [],
    filterSemester,
    setFilterSemester,

    // Status filter (optional)
    statuses = [],
    filterStatus,
    setFilterStatus,
    statusCounts = {},

    // View mode toggle
    viewMode,
    setViewMode,
    showViewToggle = false,

    // Clear filters
    onClearFilters,
    hasActiveFilters = false,

    // Results count
    filteredCount,
    totalCount,

    className = ""
}) => {
    const filterPanelRef = useRef(null);
    const contentRef = useRef(null);

    // Animate panel open/close
    useEffect(() => {
        if (!filterPanelRef.current) return;

        if (isOpen) {
            gsap.fromTo(filterPanelRef.current,
                { height: 0, opacity: 0 },
                {
                    height: 'auto',
                    opacity: 1,
                    duration: 0.35,
                    ease: 'power2.out',
                    onStart: () => {
                        filterPanelRef.current.style.display = 'block';
                    }
                }
            );
        } else {
            gsap.to(filterPanelRef.current, {
                height: 0,
                opacity: 0,
                duration: 0.25,
                ease: 'power2.in',
                onComplete: () => {
                    if (filterPanelRef.current) {
                        filterPanelRef.current.style.display = 'none';
                    }
                }
            });
        }
    }, [isOpen]);

    const hasFilters = departments.length > 0 || years.length > 0 || semesters.length > 0 || statuses.length > 0;

    if (!hasFilters) return null;

    return (
        <div
            ref={filterPanelRef}
            style={{ display: 'none', overflow: 'hidden' }}
            className={`
                relative bg-white rounded-2xl border border-zinc-100
                shadow-lg shadow-zinc-200/50
                ${className}
            `}
        >
            {/* Decorative gradient line at top */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 via-blue-500 to-emerald-500 opacity-80 rounded-t-2xl" />

            {/* Header with close button */}
            <div className="px-4 lg:px-5 py-3 border-b border-zinc-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-violet-100 rounded-lg">
                        <SlidersHorizontal className="w-4 h-4 text-violet-600" />
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-zinc-800">Filter Options</h3>
                        <p className="text-[11px] text-zinc-500">Refine your results</p>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="p-2 hover:bg-zinc-100 rounded-lg transition-colors"
                >
                    <X className="w-4 h-4 text-zinc-400" />
                </button>
            </div>

            {/* Filter Content */}
            <div ref={contentRef} className="p-4 lg:p-5">
                {/* Search Input */}
                {setSearchQuery && (
                    <div className="mb-4">
                        <div className="relative group">
                            <div className="absolute left-0 top-0 bottom-0 w-10 flex items-center justify-center pointer-events-none">
                                <Search className="w-4 h-4 text-zinc-400 group-focus-within:text-violet-500 transition-colors" />
                            </div>
                            <input
                                type="text"
                                placeholder={searchPlaceholder}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="
                                    w-full pl-10 pr-10 py-3 text-sm bg-zinc-50/80 border-0 rounded-xl
                                    focus:outline-none focus:ring-2 focus:ring-violet-200 focus:bg-white
                                    transition-all duration-200 text-zinc-700 placeholder-zinc-400
                                    hover:bg-zinc-100/80
                                "
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 bg-zinc-200 hover:bg-zinc-300 rounded-lg transition-colors"
                                >
                                    <X className="w-3 h-3 text-zinc-500" />
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* Filter Sections Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {/* Department Filters */}
                    {departments.length > 0 && (
                        <div className="space-y-2.5 p-3 bg-zinc-50/50 rounded-xl">
                            <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                                <Building className="w-3 h-3" />
                                Department
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                                {departments.map((dept) => (
                                    <FilterChip
                                        key={dept}
                                        label={dept === 'all' ? 'All' : dept}
                                        active={filterDept === dept}
                                        onClick={() => setFilterDept(dept)}
                                        count={dept !== 'all' ? deptCounts[dept] : undefined}
                                        color={dept === 'all' ? 'zinc' : 'blue'}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Year Filters */}
                    {years.length > 0 && (
                        <div className="space-y-2.5 p-3 bg-zinc-50/50 rounded-xl">
                            <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                                <GraduationCap className="w-3 h-3" />
                                Year
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                                {years.map((year) => (
                                    <FilterChip
                                        key={year}
                                        label={year === 'all' ? 'All' : `Year ${year}`}
                                        active={filterYear === year}
                                        onClick={() => setFilterYear(year)}
                                        count={year !== 'all' ? yearCounts[year] : undefined}
                                        color={year === 'all' ? 'zinc' : 'emerald'}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Semester Filters */}
                    {semesters.length > 0 && (
                        <div className="space-y-2.5 p-3 bg-zinc-50/50 rounded-xl">
                            <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                                <Hash className="w-3 h-3" />
                                Semester
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                                {semesters.map((sem) => (
                                    <FilterChip
                                        key={sem}
                                        label={sem === '' ? 'All' : `Sem ${sem}`}
                                        active={filterSemester === sem}
                                        onClick={() => setFilterSemester(sem)}
                                        color={sem === '' ? 'zinc' : 'amber'}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Status Filters */}
                    {statuses.length > 0 && (
                        <div className="space-y-2.5 p-3 bg-zinc-50/50 rounded-xl">
                            <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                                <Sparkles className="w-3 h-3" />
                                Status
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                                {statuses.map((status) => (
                                    <FilterChip
                                        key={status}
                                        label={status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
                                        active={filterStatus === status}
                                        onClick={() => setFilterStatus(status)}
                                        count={status !== 'all' ? statusCounts[status] : undefined}
                                        color={status === 'all' ? 'zinc' : status === 'pending' ? 'amber' : status === 'approved' || status === 'active' ? 'emerald' : 'red'}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* View Mode Toggle */}
                {showViewToggle && setViewMode && (
                    <div className="mt-4 pt-4 border-t border-zinc-100">
                        <div className="flex items-center gap-3">
                            <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">View</span>
                            <div className="flex items-center p-1 bg-zinc-100 rounded-xl">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`
                                        flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
                                        ${viewMode === 'grid'
                                            ? 'bg-white text-zinc-900 shadow-sm'
                                            : 'text-zinc-500 hover:text-zinc-700'
                                        }
                                    `}
                                >
                                    <Grid3X3 className="w-4 h-4" />
                                    <span>Grid</span>
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`
                                        flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
                                        ${viewMode === 'list'
                                            ? 'bg-white text-zinc-900 shadow-sm'
                                            : 'text-zinc-500 hover:text-zinc-700'
                                        }
                                    `}
                                >
                                    <List className="w-4 h-4" />
                                    <span>List</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer Bar - Results count and clear */}
            <div className="px-4 lg:px-5 py-3 bg-zinc-50/80 border-t border-zinc-100 flex items-center justify-between rounded-b-2xl">
                <div className="flex items-center gap-3">
                    {filteredCount !== undefined && totalCount !== undefined && (
                        <p className="text-xs text-zinc-500">
                            Showing <span className="font-semibold text-zinc-700">{filteredCount}</span> of{' '}
                            <span className="font-semibold text-zinc-700">{totalCount}</span> results
                        </p>
                    )}
                    {hasActiveFilters && (
                        <span className="flex items-center gap-1 text-[10px] font-medium text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full">
                            <Filter className="w-2.5 h-2.5" />
                            Filters active
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {hasActiveFilters && onClearFilters && (
                        <button
                            onClick={onClearFilters}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                        >
                            <X className="w-3 h-3" />
                            Clear all
                        </button>
                    )}
                    <button
                        onClick={onClose}
                        className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium text-white bg-violet-600 hover:bg-violet-700 rounded-lg transition-colors"
                    >
                        Apply Filters
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PremiumFilterBar;
