import React, { useState, useEffect } from 'react';
import { getStudyProgress, toggleTopicProgress } from '../utils/api';

const MindMapViewer = ({ subject }) => {
  const [progress, setProgress] = useState({ completedTopics: [], status: 'Not Started' });

  useEffect(() => {
    if (subject) {
      fetchProgress();
    }
  }, [subject]);

  const fetchProgress = async () => {
    try {
      const { data } = await getStudyProgress(subject._id);
      setProgress(data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleToggle = async (topicName) => {
    try {
      const { data } = await toggleTopicProgress({ subjectId: subject._id, topicName });
      setProgress(data);
    } catch (error) {
      console.error(error);
    }
  };

  if (!subject) return <div className="text-center text-gray-500 mt-10">Select a subject to view its Mind Map</div>;

  const calculatePercentage = () => {
    let total = 0;
    subject.syllabus.forEach(u => total += u.topics.length);
    if (total === 0) return 0;
    return Math.round((progress.completedTopics.length / total) * 100);
  };

  return (
    <div className="p-4 overflow-auto h-full relative">
      <div className="absolute top-2 right-2 bg-white px-3 py-1 rounded shadow text-sm font-bold text-primary-600 border">
        Progress: {calculatePercentage()}%
      </div>

      <div className="flex flex-col items-center mt-8">
        {/* Root Node */}
        <div className="bg-primary-600 text-white px-6 py-3 rounded-lg shadow-lg font-bold text-lg mb-8 relative z-10">
          {subject.name}
          <div className="absolute -bottom-8 left-1/2 w-0.5 h-8 bg-gray-300 -translate-x-1/2"></div>
        </div>

        {/* Units Layer */}
        <div className="flex gap-8 justify-center w-full">
          {subject.syllabus.map((unit, uIdx) => (
            <div key={uIdx} className="flex flex-col items-center relative">
              {/* Connector from Root */}
              <div className="absolute -top-8 left-1/2 w-full h-0.5 bg-gray-300 -translate-x-1/2" 
                   style={{ width: subject.syllabus.length > 1 ? '100%' : '0' }}></div>
              <div className="absolute -top-8 left-1/2 w-0.5 h-8 bg-gray-300 -translate-x-1/2"></div>

              {/* Unit Node */}
              <div className="bg-green-100 border-2 border-green-500 text-green-800 px-4 py-2 rounded-md shadow mb-6 relative z-10 font-semibold text-sm w-40 text-center">
                {unit.unit}
                <div className="absolute -bottom-6 left-1/2 w-0.5 h-6 bg-gray-300 -translate-x-1/2"></div>
              </div>

              {/* Topics Layer */}
              <div className="flex flex-col gap-4">
                {unit.topics.map((topic, tIdx) => {
                  const isCompleted = progress.completedTopics.includes(topic.name);
                  return (
                    <div key={tIdx} className="relative group">
                      {/* Topic Node */}
                      <div 
                        onClick={() => handleToggle(topic.name)}
                        className={`border px-3 py-2 rounded shadow-sm text-xs w-36 cursor-pointer transition-all ${
                          isCompleted ? 'bg-green-50 border-green-300' : 'bg-white border-gray-300 hover:bg-primary-50'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <div className={`font-bold ${isCompleted ? 'text-green-700 line-through' : 'text-gray-700'}`}>
                            {topic.name}
                          </div>
                          <input 
                            type="checkbox" 
                            checked={isCompleted} 
                            readOnly 
                            className="mt-1 cursor-pointer"
                          />
                        </div>
                        <div className="flex justify-between items-center">
                          <span className={`text-[10px] px-1 rounded ${
                            topic.difficulty === 'Hard' ? 'bg-red-100 text-red-600' : 
                            topic.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-600' : 
                            'bg-green-100 text-green-600'
                          }`}>{topic.difficulty}</span>
                          <span className="text-[10px] text-gray-400">{topic.estimatedTime}</span>
                        </div>
                        
                        {/* Reference Material Link */}
                        {topic.resources && topic.resources.length > 0 && (
                          <div className="mt-2 pt-1 border-t border-gray-100">
                            <a 
                              href={topic.resources[0].url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-[10px] text-primary-500 hover:underline flex items-center gap-1"
                              onClick={(e) => e.stopPropagation()}
                            >
                              📄 View Material
                            </a>
                          </div>
                        )}
                      </div>
                      
                      {/* Resources Tooltip (Simple implementation) */}
                      {topic.resources && topic.resources.length > 0 && (
                        <div className="hidden group-hover:block absolute left-full top-0 ml-2 bg-gray-800 text-white text-xs p-2 rounded w-48 z-50">
                          <p className="font-bold mb-1 border-b border-gray-600 pb-1">Resources:</p>
                          {topic.resources.map((res, rIdx) => (
                            <a key={rIdx} href={res.url} target="_blank" rel="noreferrer" className="block text-primary-300 hover:underline mb-1 truncate">
                              [{res.type}] {res.title}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MindMapViewer;
