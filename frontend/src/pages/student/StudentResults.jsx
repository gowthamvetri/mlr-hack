import React, { useState, useEffect } from 'react';
import {
    Trophy, Search, Calendar, Award, CheckCircle,
    XCircle, Clock, FileText, ChevronRight
} from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import { getMyResults } from '../../utils/api';
import gsap from 'gsap';

const StudentResults = () => {
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('userInfo')));
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchResults();
    }, []);

    useEffect(() => {
        if (!loading && results.length > 0) {
            gsap.from('.result-card', {
                y: 20,
                opacity: 0,
                duration: 0.5,
                stagger: 0.1,
                ease: 'power2.out'
            });
        }
    }, [loading, results]);

    const fetchResults = async () => {
        try {
            const { data } = await getMyResults();
            setResults(data);
        } catch (error) {
            console.error('Error fetching results:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        const s = status?.toLowerCase();
        if (s === 'pass' || s === 'selected') return 'text-emerald-600 bg-emerald-50 border-emerald-200';
        if (s === 'fail' || s === 'rejected') return 'text-red-600 bg-red-50 border-red-200';
        return 'text-amber-600 bg-amber-50 border-amber-200'; // Pending or Waitlisted
    };

    const getStatusIcon = (status) => {
        const s = status?.toLowerCase();
        if (s === 'pass' || s === 'selected') return <CheckCircle className="w-5 h-5" />;
        if (s === 'fail' || s === 'rejected') return <XCircle className="w-5 h-5" />;
        return <Clock className="w-5 h-5" />;
    };

    const filteredResults = results.filter(r =>
        r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.examType.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <DashboardLayout role="Student" userName={user?.name}>
            <div className="max-w-5xl mx-auto p-6 space-y-8">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Exam & Placement Results</h1>
                        <p className="text-zinc-500 mt-1">View your official results and scores.</p>
                    </div>
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 group-focus-within:text-violet-600 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search results..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-12 pr-4 py-3 bg-white border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all text-zinc-900 placeholder-zinc-400 w-full md:w-64"
                        />
                    </div>
                </div>

                {/* Results Grid */}
                {loading ? (
                    <div className="text-center py-24">
                        <div className="w-12 h-12 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin mx-auto mb-4" />
                        <p className="text-zinc-500 font-bold">Loading results...</p>
                    </div>
                ) : filteredResults.length > 0 ? (
                    <div className="space-y-4">
                        {filteredResults.map((result) => (
                            <div key={result._id} className="result-card group bg-white p-6 rounded-xl border border-zinc-200 hover:border-violet-200 hover:shadow-md transition-all relative overflow-hidden">
                                {/* Decorative gradient for Pass/Selected */}
                                {(result.status === 'Pass' || result.status === 'Selected') && (
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-50 to-transparent -mr-10 -mt-10 rounded-full opacity-50" />
                                )}

                                <div className="flex flex-col md:flex-row md:items-center gap-6 relative z-10">
                                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${result.examType === 'Placement' ? 'bg-violet-50 text-violet-600 border border-violet-100' : 'bg-blue-50 text-blue-600 border border-blue-100'
                                        }`}>
                                        {result.examType === 'Placement' ? <Award className="w-8 h-8" /> : <FileText className="w-8 h-8" />}
                                    </div>

                                    <div className="flex-1">
                                        <div className="flex flex-wrap items-center gap-2 mb-1">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${result.examType === 'Placement' ? 'bg-violet-50 text-violet-700 border-violet-100' : 'bg-blue-50 text-blue-700 border-blue-100'
                                                }`}>
                                                {result.examType}
                                            </span>
                                            <span className="text-xs text-zinc-400 flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                {new Date(result.publishedAt || result.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <h3 className="text-lg font-bold text-zinc-900 group-hover:text-violet-700 transition-colors">
                                            {result.title}
                                        </h3>
                                        <p className="text-sm text-zinc-500 mt-1">
                                            Department: <span className="text-zinc-700 font-medium">{result.department}</span>
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-4 md:border-l md:border-zinc-100 md:pl-6">
                                        <div className="text-right">
                                            <p className="text-xs text-zinc-400 font-bold uppercase tracking-wide mb-1">Score</p>
                                            <p className="text-xl font-black text-zinc-900 font-mono">{result.score}</p>
                                        </div>
                                        <div className={`px-4 py-2 rounded-lg border flex items-center gap-2 ${getStatusColor(result.status)}`}>
                                            {getStatusIcon(result.status)}
                                            <span className="font-bold text-sm uppercase tracking-wide">{result.status}</span>
                                        </div>
                                    </div>
                                </div>

                                {result.remarks && (
                                    <div className="mt-4 pt-4 border-t border-zinc-100 relative z-10">
                                        <p className="text-sm text-zinc-600 bg-zinc-50 p-3 rounded-lg border border-zinc-100 italic">
                                            <span className="font-bold text-zinc-400 not-italic mr-2">Remarks:</span>
                                            "{result.remarks}"
                                        </p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-white rounded-xl border border-zinc-200 border-dashed">
                        <div className="w-20 h-20 bg-zinc-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-zinc-100">
                            <Trophy className="w-10 h-10 text-zinc-300" />
                        </div>
                        <h3 className="text-xl font-bold text-zinc-900">No Results Found</h3>
                        <p className="text-zinc-500 mt-1 max-w-sm mx-auto">
                            {searchQuery ? 'Try adjusting your search terms.' : 'Results will appear here once they are published.'}
                        </p>
                    </div>
                )}

            </div>
        </DashboardLayout>
    );
};

export default StudentResults;
