import React, { useState, useEffect } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { auth } from "./firebaseConfig";
import Loading_page from "./Loading_page";

const ProtectedRoute = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((authUser) => {
            console.log("Auth User:", authUser); // Debugging: Check if user is logged in
            setUser(authUser);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    if (loading) return <Loading_page />;

    return user ? <Outlet /> : <Navigate to="/" replace />;
};

export default ProtectedRoute;
