import React, { useState, useEffect } from 'react'
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars, faHome, faComment, faUser } from "@fortawesome/free-solid-svg-icons";
import "./Navbar.css"
import { auth, db } from './firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from "firebase/firestore";

const Navbar = ({ is_attemting}) => {
    const navigate = useNavigate();
    const [avatar_index, setAvatar_index] = useState(0);
    const [show_slid_bar, setShow_slid_bar] = useState(false);

    const avatars = [
        "https://api.dicebear.com/7.x/adventurer/svg?seed=Female3",
        "https://api.dicebear.com/7.x/adventurer/svg?seed=Female9",
        "https://api.dicebear.com/7.x/adventurer/svg?seed=Female14",
        "https://api.dicebear.com/7.x/adventurer/svg?seed=Male10",
        "https://api.dicebear.com/7.x/adventurer/svg?seed=Male13",
        "https://api.dicebear.com/7.x/adventurer/svg?seed=Male17"
    ];

    useEffect(() => {
      const unsubscribe = onAuthStateChanged(auth,async(current_user)=>{
        if(current_user){
            const user_doc_ref = doc(db,"users",auth.currentUser.uid);
            const user_doc_snap = await getDoc(user_doc_ref);
            if(user_doc_snap.exists()){
                setAvatar_index(user_doc_snap.data().avatar_index || 0);
            } else {
                console.log("No username found in Firestore");
              }
        }
      })
    
      return () => unsubscribe();
    },)
    

    const handle_home_click = () => {
        if (!is_attemting) {
            navigate("/home");
        }
    }

    const handle_profile_click = () => {
        if (!is_attemting) {
            navigate("/profile");
        }
    }

    return (
        <div className="home-nav">
            <div className="logo">
                <p><b>GLUG</b> QUIZ</p>
            </div>
            <div className="profile">
                <ul>
                    <li onClick={handle_home_click} style={{ cursor: is_attemting ? "not-allowed" : "pointer" }} aria-disabled={is_attemting}>Home</li>
                    <li onClick={handle_home_click} style={{ cursor: is_attemting ? "not-allowed" : "pointer" }} aria-disabled={is_attemting}>About</li>
                    <li onClick={handle_home_click} style={{ cursor: is_attemting ? "not-allowed" : "pointer" }} aria-disabled={is_attemting}>Contact</li>
                </ul>
                <div className="img" onClick={handle_profile_click} style={{ cursor: is_attemting ? "not-allowed" : "pointer" }} aria-disabled={is_attemting}>
                    <img src={avatars[avatar_index]} alt="" />
                </div>
            </div>
            <div className="hamburger" onClick={() => { setShow_slid_bar(!show_slid_bar) }}>
                <FontAwesomeIcon icon={faBars} />
            </div>
            <div className="hamburger-slid-bar" style={{ transform: show_slid_bar ? "translateX(0)" : "translateX(100%)" }}>
                <div className="img" onClick={handle_profile_click} style={{ cursor: is_attemting ? "not-allowed" : "pointer" }} aria-disabled={is_attemting}>
                    <img src={avatars[avatar_index]} alt="" />
                </div>
                <ul>
                    <li onClick={handle_home_click} style={{ cursor: is_attemting ? "not-allowed" : "pointer" }} aria-disabled={is_attemting}><FontAwesomeIcon icon={faHome} /> Home</li>
                    <li onClick={handle_home_click} style={{ cursor: is_attemting ? "not-allowed" : "pointer" }} aria-disabled={is_attemting}><FontAwesomeIcon icon={faUser} /> About</li>
                    <li onClick={handle_home_click} style={{ cursor: is_attemting ? "not-allowed" : "pointer" }} aria-disabled={is_attemting}><FontAwesomeIcon icon={faComment} /> Contact</li>
                </ul>
            </div>
        </div>
    )
}

export default Navbar
