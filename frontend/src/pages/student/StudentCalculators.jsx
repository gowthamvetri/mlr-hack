import { useState } from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../store/slices/authSlice';
import DashboardLayout from '../../components/DashboardLayout';
import { Calculator, Plus, Trash2, RotateCcw, BookOpen, GraduationCap } from 'lucide-react';

const StudentCalculators = () => {
    const user = useSelector(selectCurrentUser);
    const [activeTab, setActiveTab] = useState('sgpa');

    // SGPA Calculator State
    const [sgpaSubjects, setSgpaSubjects] = useState([
        { id: 1, name: '', credits: '', gradePoint: '' }
    ]);
    const [sgpaResult, setSgpaResult] = useState(null);

    // CGPA Calculator State
    const [semesters, setSemesters] = useState([
        { id: 1, semester: '1', sgpa: '', credits: '' }
    ]);
    const [cgpaResult, setCgpaResult] = useState(null);

    // Grade point options
    const gradePoints = [
        { grade: 'O', point: 10 },
        { grade: 'A+', point: 9 },
        { grade: 'A', point: 8 },
        { grade: 'B+', point: 7 },
        { grade: 'B', point: 6 },
        { grade: 'C', point: 5 },
        { grade: 'P', point: 4 },
        { grade: 'F', point: 0 }
    ];

    // SGPA Functions
    const addSubject = () => {
        setSgpaSubjects([
            ...sgpaSubjects,
            { id: Date.now(), name: '', credits: '', gradePoint: '' }
        ]);
    };

    const removeSubject = (id) => {
        if (sgpaSubjects.length > 1) {
            setSgpaSubjects(sgpaSubjects.filter(s => s.id !== id));
        }
    };

    const updateSubject = (id, field, value) => {
        setSgpaSubjects(sgpaSubjects.map(s =>
            s.id === id ? { ...s, [field]: value } : s
        ));
    };

    const calculateSGPA = () => {
        const validSubjects = sgpaSubjects.filter(s => s.credits && s.gradePoint);
        if (validSubjects.length === 0) {
            setSgpaResult({ error: 'Please enter at least one subject with credits and grade' });
            return;
        }

        const totalCreditPoints = validSubjects.reduce((sum, s) => {
            return sum + (parseFloat(s.credits) * parseFloat(s.gradePoint));
        }, 0);

        const totalCredits = validSubjects.reduce((sum, s) => {
            return sum + parseFloat(s.credits);
        }, 0);

        const sgpa = totalCreditPoints / totalCredits;
        setSgpaResult({
            sgpa: sgpa.toFixed(2),
            totalCredits: totalCredits,
            totalCreditPoints: totalCreditPoints.toFixed(2)
        });
    };

    const resetSGPA = () => {
        setSgpaSubjects([{ id: 1, name: '', credits: '', gradePoint: '' }]);
        setSgpaResult(null);
    };

    // CGPA Functions
    const addSemester = () => {
        const nextSem = semesters.length + 1;
        setSemesters([
            ...semesters,
            { id: Date.now(), semester: nextSem.toString(), sgpa: '', credits: '' }
        ]);
    };

    const removeSemester = (id) => {
        if (semesters.length > 1) {
            setSemesters(semesters.filter(s => s.id !== id));
        }
    };

    const updateSemester = (id, field, value) => {
        setSemesters(semesters.map(s =>
            s.id === id ? { ...s, [field]: value } : s
        ));
    };

    const calculateCGPA = () => {
        const validSemesters = semesters.filter(s => s.sgpa && s.credits);
        if (validSemesters.length === 0) {
            setCgpaResult({ error: 'Please enter at least one semester with SGPA and credits' });
            return;
        }

        const totalWeightedSGPA = validSemesters.reduce((sum, s) => {
            return sum + (parseFloat(s.sgpa) * parseFloat(s.credits));
        }, 0);

        const totalCredits = validSemesters.reduce((sum, s) => {
            return sum + parseFloat(s.credits);
        }, 0);

        const cgpa = totalWeightedSGPA / totalCredits;
        setCgpaResult({
            cgpa: cgpa.toFixed(2),
            totalCredits: totalCredits,
            semesterCount: validSemesters.length
        });
    };

    const resetCGPA = () => {
        setSemesters([{ id: 1, semester: '1', sgpa: '', credits: '' }]);
        setCgpaResult(null);
    };

    return (
        <DashboardLayout>
            <div className="max-w-[1400px] mx-auto space-y-6 animate-fade-in">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-zinc-900">Grade Calculators</h1>
                    <p className="text-zinc-500 mt-1">Calculate your SGPA and CGPA easily</p>
                </div>

                {/* Tab Navigation */}
                <div className="flex gap-2 mb-6">
                    <button
                        onClick={() => setActiveTab('sgpa')}
                        className={`flex items-center gap-2 px-6 py-3 rounded-lg font-bold transition-all ${activeTab === 'sgpa'
                            ? 'bg-zinc-900 text-white shadow-md'
                            : 'bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-50 hover:text-zinc-900'
                            }`}
                    >
                        <BookOpen className="w-5 h-5" />
                        SGPA Calculator
                    </button>
                    <button
                        onClick={() => setActiveTab('cgpa')}
                        className={`flex items-center gap-2 px-6 py-3 rounded-lg font-bold transition-all ${activeTab === 'cgpa'
                            ? 'bg-zinc-900 text-white shadow-md'
                            : 'bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-50 hover:text-zinc-900'
                            }`}
                    >
                        <GraduationCap className="w-5 h-5" />
                        CGPA Calculator
                    </button>
                </div>

                {/* SGPA Calculator */}
                {activeTab === 'sgpa' && (
                    <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-6 animate-fade-in">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-center">
                                    <Calculator className="w-6 h-6 text-blue-600" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-zinc-900">SGPA Calculator</h2>
                                    <p className="text-sm text-zinc-500 font-medium">Semester Grade Point Average</p>
                                </div>
                            </div>
                            <button
                                onClick={resetSGPA}
                                className="flex items-center gap-2 px-4 py-2 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 border border-transparent hover:border-zinc-200 rounded-lg transition-all font-bold"
                            >
                                <RotateCcw className="w-4 h-4" />
                                Reset
                            </button>
                        </div>

                        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6">
                            <p className="text-sm text-blue-700 font-medium">
                                <strong className="text-blue-800">Formula:</strong> SGPA = Σ(Credits × Grade Point) ÷ Σ Credits
                            </p>
                        </div>

                        {/* Subject List */}
                        <div className="space-y-3 mb-6">
                            <div className="grid grid-cols-12 gap-3 text-sm font-bold text-zinc-500 uppercase tracking-wide px-2">
                                <div className="col-span-5">Subject Name</div>
                                <div className="col-span-2">Credits</div>
                                <div className="col-span-4">Grade</div>
                                <div className="col-span-1"></div>
                            </div>

                            {sgpaSubjects.map((subject, index) => (
                                <div key={subject.id} className="grid grid-cols-12 gap-3 items-center bg-zinc-50 p-3 rounded-lg border border-zinc-200 hover:border-zinc-300 transition-colors">
                                    <div className="col-span-5">
                                        <input
                                            type="text"
                                            placeholder={`Subject ${index + 1}`}
                                            value={subject.name}
                                            onChange={(e) => updateSubject(subject.id, 'name', e.target.value)}
                                            className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg focus:ring-2 focus:ring-zinc-900 focus:border-transparent text-zinc-900 placeholder-zinc-400 transition-all font-medium"
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <input
                                            type="number"
                                            placeholder="3"
                                            min="1"
                                            max="6"
                                            value={subject.credits}
                                            onChange={(e) => updateSubject(subject.id, 'credits', e.target.value)}
                                            className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg focus:ring-2 focus:ring-zinc-900 focus:border-transparent text-zinc-900 placeholder-zinc-400 transition-all font-medium"
                                        />
                                    </div>
                                    <div className="col-span-4">
                                        <select
                                            value={subject.gradePoint}
                                            onChange={(e) => updateSubject(subject.id, 'gradePoint', e.target.value)}
                                            className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg focus:ring-2 focus:ring-zinc-900 focus:border-transparent text-zinc-900 cursor-pointer transition-all font-medium"
                                        >
                                            <option value="" className="bg-white text-zinc-900">Select Grade</option>
                                            {gradePoints.map(g => (
                                                <option key={g.grade} value={g.point} className="bg-white text-zinc-900">{g.grade} ({g.point})</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="col-span-1 flex justify-center">
                                        <button
                                            onClick={() => removeSubject(subject.id)}
                                            disabled={sgpaSubjects.length === 1}
                                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="flex gap-3 mb-6">
                            <button
                                onClick={addSubject}
                                className="flex items-center gap-2 px-4 py-2 border border-dashed border-zinc-300 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 hover:border-zinc-400 rounded-lg transition-all font-bold"
                            >
                                <Plus className="w-4 h-4" />
                                Add Subject
                            </button>
                            <button
                                onClick={calculateSGPA}
                                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg font-bold transition-all shadow-md"
                            >
                                <Calculator className="w-5 h-5" />
                                Calculate SGPA
                            </button>
                        </div>

                        {/* SGPA Result */}
                        {sgpaResult && (
                            <div className={`p-6 rounded-xl border ${sgpaResult.error ? 'bg-red-50 text-red-600 border-red-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                                {sgpaResult.error ? (
                                    <p className="font-bold">{sgpaResult.error}</p>
                                ) : (
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-zinc-500 mb-1 font-bold uppercase tracking-wide">Your SGPA</p>
                                            <p className="text-4xl font-bold text-zinc-900">{sgpaResult.sgpa}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm text-zinc-500 font-medium">Total Credits: <span className="font-bold text-zinc-900">{sgpaResult.totalCredits}</span></p>
                                            <p className="text-sm text-zinc-500 font-medium">Total Points: <span className="font-bold text-zinc-900">{sgpaResult.totalCreditPoints}</span></p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* CGPA Calculator */}
                {activeTab === 'cgpa' && (
                    <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-6 animate-fade-in">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-purple-50 border border-purple-100 rounded-xl flex items-center justify-center">
                                    <GraduationCap className="w-6 h-6 text-purple-600" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-zinc-900">CGPA Calculator</h2>
                                    <p className="text-sm text-zinc-500 font-medium">Cumulative Grade Point Average</p>
                                </div>
                            </div>
                            <button
                                onClick={resetCGPA}
                                className="flex items-center gap-2 px-4 py-2 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 border border-transparent hover:border-zinc-200 rounded-lg transition-all font-bold"
                            >
                                <RotateCcw className="w-4 h-4" />
                                Reset
                            </button>
                        </div>

                        <div className="bg-purple-50 border border-purple-100 rounded-lg p-4 mb-6">
                            <p className="text-sm text-purple-700 font-medium">
                                <strong className="text-purple-800">Formula:</strong> CGPA = Σ(SGPA × Semester Credits) ÷ Σ Total Credits
                            </p>
                        </div>

                        {/* Semester List */}
                        <div className="space-y-3 mb-6">
                            <div className="grid grid-cols-12 gap-3 text-sm font-bold text-zinc-500 uppercase tracking-wide px-2">
                                <div className="col-span-3">Semester</div>
                                <div className="col-span-4">SGPA</div>
                                <div className="col-span-4">Credits</div>
                                <div className="col-span-1"></div>
                            </div>

                            {semesters.map((sem) => (
                                <div key={sem.id} className="grid grid-cols-12 gap-3 items-center bg-zinc-50 p-3 rounded-lg border border-zinc-200 hover:border-zinc-300 transition-colors">
                                    <div className="col-span-3">
                                        <input
                                            type="text"
                                            value={`Semester ${sem.semester}`}
                                            disabled
                                            className="w-full px-3 py-2 bg-zinc-100 border border-zinc-200 rounded-lg text-zinc-500 font-bold"
                                        />
                                    </div>
                                    <div className="col-span-4">
                                        <input
                                            type="number"
                                            placeholder="8.5"
                                            min="0"
                                            max="10"
                                            step="0.01"
                                            value={sem.sgpa}
                                            onChange={(e) => updateSemester(sem.id, 'sgpa', e.target.value)}
                                            className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg focus:ring-2 focus:ring-zinc-900 focus:border-transparent text-zinc-900 placeholder-zinc-400 transition-all font-medium"
                                        />
                                    </div>
                                    <div className="col-span-4">
                                        <input
                                            type="number"
                                            placeholder="20"
                                            min="1"
                                            max="40"
                                            value={sem.credits}
                                            onChange={(e) => updateSemester(sem.id, 'credits', e.target.value)}
                                            className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg focus:ring-2 focus:ring-zinc-900 focus:border-transparent text-zinc-900 placeholder-zinc-400 transition-all font-medium"
                                        />
                                    </div>
                                    <div className="col-span-1 flex justify-center">
                                        <button
                                            onClick={() => removeSemester(sem.id)}
                                            disabled={semesters.length === 1}
                                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="flex gap-3 mb-6">
                            <button
                                onClick={addSemester}
                                className="flex items-center gap-2 px-4 py-2 border border-dashed border-zinc-300 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 hover:border-zinc-400 rounded-lg transition-all font-bold"
                            >
                                <Plus className="w-4 h-4" />
                                Add Semester
                            </button>
                            <button
                                onClick={calculateCGPA}
                                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg font-bold transition-all shadow-md"
                            >
                                <Calculator className="w-5 h-5" />
                                Calculate CGPA
                            </button>
                        </div>

                        {/* CGPA Result */}
                        {cgpaResult && (
                            <div className={`p-6 rounded-xl border ${cgpaResult.error ? 'bg-red-50 text-red-600 border-red-100' : 'bg-purple-50 text-purple-600 border-purple-100'}`}>
                                {cgpaResult.error ? (
                                    <p className="font-bold">{cgpaResult.error}</p>
                                ) : (
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-zinc-500 mb-1 font-bold uppercase tracking-wide">Your CGPA</p>
                                            <p className="text-4xl font-bold text-zinc-900">{cgpaResult.cgpa}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm text-zinc-500 font-medium">Semesters: <span className="font-bold text-zinc-900">{cgpaResult.semesterCount}</span></p>
                                            <p className="text-sm text-zinc-500 font-medium">Total Credits: <span className="font-bold text-zinc-900">{cgpaResult.totalCredits}</span></p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default StudentCalculators;
