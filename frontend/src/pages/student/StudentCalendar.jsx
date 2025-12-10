import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getStudentExams, getEvents } from '../../utils/api';
import DashboardLayout from '../../components/DashboardLayout';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, MapPin, FileText, Users } from 'lucide-react';

const StudentCalendar = () => {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [exams, setExams] = useState([]);
  const [events, setEvents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [examsRes, eventsRes] = await Promise.all([
        getStudentExams(),
        getEvents('Approved')
      ]);
      setExams(examsRes.data || []);
      setEvents(eventsRes.data || []);
    } catch (error) {
      console.error('Error fetching calendar data:', error);
    }
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    return { daysInMonth, startingDay };
  };

  const { daysInMonth, startingDay } = getDaysInMonth(currentDate);

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const getEventsForDate = (day) => {
    const dateStr = new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString();
    const dayExams = exams.filter(e => new Date(e.date).toDateString() === dateStr);
    const dayEvents = events.filter(e => new Date(e.date).toDateString() === dateStr);
    return { exams: dayExams, events: dayEvents };
  };

  const hasEvents = (day) => {
    const { exams, events } = getEventsForDate(day);
    return exams.length > 0 || events.length > 0;
  };

  const isToday = (day) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    );
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                      'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : null;

  return (
    <DashboardLayout role="student" userName={user?.name}>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Academic Calendar</h1>
        <p className="text-gray-500">View your exams and events schedule</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Calendar Header */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                  <CalendarIcon className="w-5 h-5 text-primary-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-800">
                  {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={prevMonth}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => setCurrentDate(new Date())}
                  className="px-3 py-1 text-sm font-medium text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                >
                  Today
                </button>
                <button 
                  onClick={nextMonth}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Day Names */}
            <div className="grid grid-cols-7 border-b border-gray-100">
              {dayNames.map(day => (
                <div key={day} className="p-3 text-center text-sm font-medium text-gray-500">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7">
              {/* Empty cells for days before the first of the month */}
              {Array.from({ length: startingDay }).map((_, idx) => (
                <div key={`empty-${idx}`} className="p-3 min-h-[100px] border-b border-r border-gray-100 bg-gray-50" />
              ))}
              
              {/* Days of the month */}
              {Array.from({ length: daysInMonth }).map((_, idx) => {
                const day = idx + 1;
                const { exams: dayExams, events: dayEvents } = getEventsForDate(day);
                const hasContent = dayExams.length > 0 || dayEvents.length > 0;
                
                return (
                  <div 
                    key={day}
                    onClick={() => hasContent && setSelectedDate(day)}
                    className={`p-2 min-h-[100px] border-b border-r border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedDate === day ? 'bg-primary-50' : ''
                    }`}
                  >
                    <div className={`w-8 h-8 flex items-center justify-center rounded-full mb-1 ${
                      isToday(day) ? 'bg-primary-600 text-white' : 'text-gray-700'
                    }`}>
                      {day}
                    </div>
                    <div className="space-y-1">
                      {dayExams.slice(0, 2).map((exam, i) => (
                        <div key={i} className="text-xs p-1 bg-red-100 text-red-700 rounded truncate">
                          {exam.courseName}
                        </div>
                      ))}
                      {dayEvents.slice(0, 2).map((event, i) => (
                        <div key={i} className="text-xs p-1 bg-blue-100 text-blue-700 rounded truncate">
                          {event.title}
                        </div>
                      ))}
                      {(dayExams.length + dayEvents.length) > 2 && (
                        <div className="text-xs text-gray-500">
                          +{(dayExams.length + dayEvents.length) - 2} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sidebar - Selected Date Details / Upcoming */}
        <div className="lg:col-span-1 space-y-6">
          {/* Legend */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-semibold text-gray-800 mb-4">Legend</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-red-100 rounded"></div>
                <span className="text-sm text-gray-600">Exams</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-blue-100 rounded"></div>
                <span className="text-sm text-gray-600">Events</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white text-xs">
                  {new Date().getDate()}
                </div>
                <span className="text-sm text-gray-600">Today</span>
              </div>
            </div>
          </div>

          {/* Selected Date Details */}
          {selectedDate && selectedDateEvents && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100 bg-primary-50">
                <h3 className="font-semibold text-gray-800">
                  {monthNames[currentDate.getMonth()]} {selectedDate}, {currentDate.getFullYear()}
                </h3>
              </div>
              <div className="p-6 space-y-4">
                {selectedDateEvents.exams.map((exam, i) => (
                  <div key={`exam-${i}`} className="p-4 bg-red-50 rounded-xl border border-red-100">
                    <div className="flex items-center gap-2 text-red-700 mb-2">
                      <FileText className="w-4 h-4" />
                      <span className="font-medium">Exam</span>
                    </div>
                    <p className="font-semibold text-gray-800">{exam.courseName}</p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {exam.startTime}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {exam.venue || 'TBA'}
                      </span>
                    </div>
                  </div>
                ))}
                {selectedDateEvents.events.map((event, i) => (
                  <div key={`event-${i}`} className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                    <div className="flex items-center gap-2 text-blue-700 mb-2">
                      <Users className="w-4 h-4" />
                      <span className="font-medium">{event.category}</span>
                    </div>
                    <p className="font-semibold text-gray-800">{event.title}</p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {event.startTime}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {event.venue}
                      </span>
                    </div>
                  </div>
                ))}
                {selectedDateEvents.exams.length === 0 && selectedDateEvents.events.length === 0 && (
                  <p className="text-gray-500 text-center py-4">No events on this day</p>
                )}
              </div>
            </div>
          )}

          {/* Upcoming Events */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800">Upcoming</h3>
            </div>
            <div className="p-4 space-y-3 max-h-[300px] overflow-y-auto">
              {exams.filter(e => new Date(e.date) >= new Date()).slice(0, 5).map((exam, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-red-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 truncate">{exam.courseName}</p>
                    <p className="text-xs text-gray-500">{new Date(exam.date).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
              {events.filter(e => new Date(e.date) >= new Date()).slice(0, 5).map((event, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 truncate">{event.title}</p>
                    <p className="text-xs text-gray-500">{new Date(event.date).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StudentCalendar;
