import React, { useState,useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye } from "@fortawesome/free-solid-svg-icons";
import { faGoogle } from "@fortawesome/free-brands-svg-icons";
import { auth, db, provider } from "./firebaseConfig";
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signInWithPopup,
} from "firebase/auth";
import { setDoc, doc, getDoc } from "firebase/firestore";
import "./Login_page.css";
import Loading_page from "./Loading_page";

const Login_page = () => {
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirm_password, setConfirm_password] = useState("");
    const [isLogin, setIsLogin] = useState(false);
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            if (user) {
                console.log("User already logged in, redirecting to /home");
                navigate("/home", { replace: true });
            }
        });

        return () => unsubscribe();
    }, [navigate]);

    const handle_submit = async (e) => {
        e.preventDefault();

        if (!isLogin) {
            if (password !== confirm_password) {
                alert("Passwords do not match!");
                return;
            }
            setLoading(true);
            try {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                console.log(userCredential);
                const user = userCredential.user;

                await setDoc(doc(db, "users", user.uid), {
                    username: username,
                    email: email,
                });
                
                setLoading(false);
                navigate("/home");
            } catch (error) {
                alert(error.message);
            }
            setLoading(false);
        } else {
            setLoading(true);
            try {
                const userCredential = await signInWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;

                const userDoc = await getDoc(doc(db, "users", user.uid));
                if (userDoc.exists()) {
                    console.log("Welcome", userDoc.data().username);
                }
                setLoading(false);

                navigate("/home");
            } catch (error) {
                alert(error.message);
            }
            setLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setLoading(true);
        try {
            const result = await signInWithPopup(auth, provider);
            const user = result.user;

            const userRef = doc(db, "users", user.uid);
            const userDoc = await getDoc(userRef);

            if (!userDoc.exists()) {
                await setDoc(userRef, {
                    username: user.displayName,
                    email: user.email,
                    profilePic: user.photoURL,
                });
            }
            setLoading(false);
            navigate("/home");
        } catch (error) {
            alert(error.message);
        }
        
    };

    useEffect(() => {
      document.title = isLogin ? "Login - Test Your Knowledge" : "Create an Account - Unlock Exciting Quizzes";
    }, [isLogin]);
    

    if (loading) {
        return <Loading_page />;
    }

    return (
        <div className="login-body">
            <div className="container">
                <h1>{isLogin ? "Login" : "Create Account"}</h1>
                <form onSubmit={handle_submit}>
                    {!isLogin && (
                        <div>
                            <div>Username</div>
                            <input type="text" placeholder="username" value={username} onChange={(e) => setUsername(e.target.value)}/>
                        </div>
                    )}
                    <div>
                        <div>Email</div>
                        <input type="email" placeholder="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                    </div>
                    <div className="p-relative">
                        <div>Password</div>
                        <input type={isPasswordVisible ? "text" : "password"} placeholder="password" value={password} onChange={(e) => setPassword(e.target.value)}/>
                        <FontAwesomeIcon icon={faEye} className="p-absolute eye-icon" onClick={() => setIsPasswordVisible(!isPasswordVisible)}/>
                    </div>
                    {!isLogin && (
                        <div>
                            <div>Confirm Password</div>
                            <input type="password" placeholder="confirm password" value={confirm_password} onChange={(e) => setConfirm_password(e.target.value)}/>
                        </div>
                    )}
                    <div>
                        <button type="submit" id="sign_up">
                            {isLogin ? "Login" : "Sign up"}
                        </button>
                    </div>
                    <div className="or">
                        <p>or</p>
                    </div>
                    <div className="brands-icons" onClick={handleGoogleSignIn} style={{ cursor: "pointer" }}>
                        <FontAwesomeIcon icon={faGoogle} />
                        <p>Sign in with Google</p>
                    </div>
                    <p>
                        {isLogin ? "Don't have an account? " : "Already have an account? "}
                        <a href="#" onClick={(e) => {
                                e.preventDefault();
                                setIsLogin(!isLogin);
                            }}
                        >
                            {isLogin ? "Sign up" : "Login"}
                        </a>
                    </p>
                </form>
            </div>
        </div>
    );
};

export default Login_page;
