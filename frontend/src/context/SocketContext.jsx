import { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../store/slices/authSlice';

const SocketContext = createContext(null);

export const useSocket = () => {
    return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const user = useSelector(selectCurrentUser);

    useEffect(() => {
        // Only connect if user is logged in
        if (!user) {
            return;
        }

        const newSocket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
            withCredentials: true,
        });

        setSocket(newSocket);

        newSocket.on('connect', () => {
            console.log('Socket connected:', newSocket.id);

            // Join role-based room
            if (user.role) {
                newSocket.emit('join', `role:${user.role}`);
                console.log(`Joined room: role:${user.role}`);
            }

            // Join user specific room
            if (user._id) {
                newSocket.emit('join', `user:${user._id}`);
            }
        });

        return () => {
            newSocket.close();
        };
    }, [user]);

    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    );
};
