import React, { useState, useEffect, useRef } from 'react'
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRightFromBracket, faPen, faXmark } from "@fortawesome/free-solid-svg-icons";
import Navbar from './Navbar'
import './Profile.css'
import { auth, db } from './firebaseConfig';
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useNavigate } from 'react-router-dom';

const Profile = () => {
  const avatar_ref = useRef(null);
  const [username, setUsername] = useState("");
  const [avatarIndex, setAvatarIndex] = useState(0);
  const [show_avatars, setShow_avatars] = useState(false);
  const [fetch_quizzes_loading, setFetch_quizzes_loading] = useState(false);
  const [quizzes, setQuizzes] = useState([]);
  const [fetch_attempts_loading, setFetch_attempts_loading] = useState(false)
  const [attempts, setAttempts] = useState([]);
  const [quizIds, setQuizIds] = useState([]);
  const [attemptIds, setAttemptIds] = useState([]);
  const [average_score, setAverage_score] = useState({});
  const [lastAttempt, setLastAttempt] = useState({})
  const [quizName, setQuizName] = useState({});
  const [createrName, setCreaterName] = useState({});
  const navigate = useNavigate();


  const avatars = [
    "https://api.dicebear.com/7.x/adventurer/svg?seed=Female3",
    "https://api.dicebear.com/7.x/adventurer/svg?seed=Female9",
    "https://api.dicebear.com/7.x/adventurer/svg?seed=Female14",
    "https://api.dicebear.com/7.x/adventurer/svg?seed=Male10",
    "https://api.dicebear.com/7.x/adventurer/svg?seed=Male13",
    "https://api.dicebear.com/7.x/adventurer/svg?seed=Male17"
  ];


  useEffect(() => {
    if (show_avatars) {
      document.body.classList.add("no-scroll");
    } else {
      document.body.classList.remove("no-scroll");
    }
    return () => {
      document.body.classList.remove("no-scroll");
    };
  }, [show_avatars]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      const fetch_data = async () => {
        if (currentUser) {
          const userDocRef = doc(db, "users", currentUser.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            setUsername(userData.username || "Guest");
            setAvatarIndex(userData.avatar_index || 0);
            setQuizIds(userData.quizzes)
            setAttemptIds(userData.attempts)
          } else {
            console.log("No username found in Firestore");
          }
        }
      }
      await fetch_data();
    });
    return () => unsubscribe();
  }, []);

  async function calculateAverage(quizId, attemptIds) {
    if (attemptIds.length === 0) return 0;

    let totalPercentage = 0;
    let count = 0;

    try {
      const attemptDocs = await Promise.all(
        attemptIds.map(attemptId => getDoc(doc(db, "quiz_attempts", attemptId)))
      );

      let last_attempt = attemptDocs[0].data().timestamp;
      attemptDocs.forEach((attemptDocSnap, index) => {
        if (attemptDocSnap.exists()) {
          const attemptData = attemptDocSnap.data();
          const totalQuestions = attemptData.correct + attemptData.wrong + attemptData.unattempted;

          if (totalQuestions > 0) {
            const percentage = (100 * attemptData.correct) / totalQuestions;
            totalPercentage += percentage;
            count++;
          }

          if (last_attempt < attemptData.timestamp) {
            last_attempt = attemptData.timestamp;
          }
        } else {
          console.warn(`Attempt document ${attemptIds[index]} does not exist!`);
        }
      });

      if (last_attempt && last_attempt.seconds) {
        last_attempt = new Date(last_attempt.seconds * 1000);
      }
      setLastAttempt((prevans) => ({
        ...prevans,
        [quizId]: last_attempt
      }))
      return count > 0 ? (totalPercentage / count).toFixed(2) : 0;
    } catch (error) {
      console.error("Error calculating average:", error);
      return 0;
    }
  }

  async function fetchAttemptData(attempt, quizId, userId) {
    try {
      const quizRef = doc(db, "quizzes", quizId);
      const quizDataSnap = await getDoc(quizRef);
      if (quizDataSnap.exists()) {
        const quizData = quizDataSnap.data();
        setQuizName((prev) => ({
          ...prev,
          [attempt]: quizData.quiz_name
        }))
      }

      const userRef = doc(db, "users", userId);
      const userDataSnap = await getDoc(userRef);
      if (userDataSnap.exists()) {
        const userData = userDataSnap.data();
        setCreaterName((prev) => ({
          ...prev,
          [attempt]: userData.username
        }))
      }
    } catch (error) {
      console.log("Cannot get the name of the quiz:" + error);
    }
  }

  useEffect(() => {
    setFetch_quizzes_loading(true);
    const fetch_quiz_data = async () => {
      try {
        let fetchedQuizzes = [];
        let average_score = {};

        for (let quiz of quizIds) {
          const quizDocRef = doc(db, "quizzes", quiz);
          const quizDocSnap = await getDoc(quizDocRef);
          if (quizDocSnap.exists()) {
            const quizData = quizDocSnap.data();
            fetchedQuizzes.push({ id: quiz, ...quizData });
            if (quizData.attempts?.length > 0) {
              const avgScore = await calculateAverage(quiz, quizData.attempts);
              average_score[quiz] = `${avgScore}%`;
            } else {
              average_score[quiz] = "0%";
            }
          }
        }
        setQuizzes(fetchedQuizzes);
        setAverage_score(average_score);
      } catch (error) {
        console.error("Error fetching quizzes:", error);
      }
      setFetch_quizzes_loading(false);
    };
    fetch_quiz_data();
  }, [quizIds]);

  useEffect(() => {
    setFetch_attempts_loading(true);
    const fetch_attempts_data = async () => {
      try {

        let fetchedAttempts = [];

        for (let attempt of attemptIds) {
          const attemptDocRef = doc(db, "quiz_attempts", attempt);
          const attemptDocSnap = await getDoc(attemptDocRef);
          if (attemptDocSnap.exists()) {
            const attemptData = attemptDocSnap.data();
            fetchedAttempts.push({ id: attempt, ...attemptData });
            fetchAttemptData(attempt, attemptData.quiz_id, attemptData.user_id);
          }

        }
        setAttempts(fetchedAttempts);
      } catch (error) {
        console.error("Error fetching attempts:", error);
      }
      setFetch_attempts_loading(false);
    };

    fetch_attempts_data();

  }, [attemptIds]);

  useEffect(() => {
    const handle_close_avatars = (e) => {
      if (avatar_ref.current && !avatar_ref.current.contains(e.target)) {
        setShow_avatars(false);
      }
    }

    document.addEventListener("mousedown", handle_close_avatars)

    return () => {
      document.removeEventListener("mousedown", handle_close_avatars)
    }
  }, [])

  const handle_logout = async () => {
    await auth.signOut();
    navigate("/");
  }

  async function handle_change_avatar(index) {
    if (!auth.currentUser) {
      console.error("No user is signed in.");
      return;
    }

    try {
      const user_ref = doc(db, "users", auth.currentUser.uid);
      await updateDoc(user_ref, {
        avatar_index: index
      })
      setAvatarIndex(index);
      setShow_avatars(false);
    } catch (error) {
      console.log(error);
    }
  }

  function timeAgo(timestamp) {
    if (!timestamp) return "N/A";

    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    const units = [
      { unit: "year", seconds: 31536000 },
      { unit: "month", seconds: 2592000 },
      { unit: "week", seconds: 604800 },
      { unit: "day", seconds: 86400 },
      { unit: "hour", seconds: 3600 },
      { unit: "minute", seconds: 60 },
      { unit: "second", seconds: 1 },
    ];

    for (const { unit, seconds } of units) {
      const interval = Math.floor(diffInSeconds / seconds);
      if (interval >= 1) {
        return `${interval} ${unit}${interval > 1 ? "s" : ""} ago`;
      }
    }

    return "Just now";
  }

  const percentage_color = (parcentage) => {
    const red = Math.round(255 * (1 - parcentage / 100));
    const green = Math.round(255 * (parcentage / 100));
    const blue = 0;
    return `rgb(${red},${green},${blue})`
  }

  function formatDate(timestamp) {
    if (!timestamp) return "N/A";

    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);

    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  }


  useEffect(() => {
    document.title = "Profile - Your Quiz Achievements";
  }, []);

  return (
    <div>
      <div className='profile-body'>
        {show_avatars && (
          <div className="avatars-body">
            <div className="avatar-box" ref={avatar_ref}>
              {avatars.map((avatar, index) => (
                <img
                  src={avatar}
                  alt=""
                  key={index}
                  onClick={() => { handle_change_avatar(index) }}
                />
              ))}
            </div>
          </div>
        )}
        <Navbar is_attemting={false} avatarIndex={avatarIndex} />
        <div className="container">
          <div className="profile-header">
            <div className="profile-info">
              <img
                src={avatars[avatarIndex]}
                alt={username}
                className="avatar"
                onClick={() => { setShow_avatars(true) }}
              />
              <div className="user-details">
                <h1 className="username">{username || "Guest"}</h1>
                <p className="bio">Quiz enthusiast and creator</p>
                <div className="stats">
                  <div className="stat">
                    <div className="stat-value">{quizzes.length}</div>
                    <div className="stat-label">Quizzes Created</div>
                  </div>
                  <div className="stat">
                    <div className="stat-value">{attempts.length}</div>
                    <div className="stat-label">Quizzes Attempted</div>
                  </div>
                </div>
              </div>
            </div>
            <button className="logout-btn" onClick={handle_logout}><FontAwesomeIcon icon={faArrowRightFromBracket} /> Logout</button>
          </div>

          <div className="content-grid">


            <div className="section">
              <h2 className="section-title">📚 Created Quizzes</h2>
              <div className="quiz-list">
                {fetch_quizzes_loading ? (
                  <div className="quiz-card skeleton">
                    <div className="skeleton-title"></div>
                    <div className="skeleton-line"></div>
                    <div className="skeleton-line"></div>
                    <div className="skeleton-line"></div>
                    <div className="skeleton-line"></div>
                    <div className="skeleton-line"></div>
                  </div>
                ) : (
                  quizzes.length ? (
                    quizzes.map((quiz) => (
                      <div key={quiz.id} className="quiz-card">
                        <h3>{quiz.quiz_name}</h3>
                        <p><strong>Questions:</strong> {quiz.questions?.length || 0}</p>
                        <p><strong>Time:</strong> {quiz.timer ? `${quiz.timer} min` : "Unlimited"}</p>
                        <p><strong>Average Score:</strong> {average_score?.[quiz.id] ?? "N/A"}</p>
                        <p><strong>Last Attempt:</strong> {formatDate(lastAttempt?.[quiz.id]) ?? "Never"}</p>
                        <p><strong>Total Attempts:</strong> {quiz.total_attempts ?? 0}</p>
                      </div>
                    ))
                  ) : (
                    <p>No quizzes created yet!</p>
                  )
                )}

              </div>
            </div>


            <div className="section">
              <h2 className="section-title">🏆 Quiz Attempts</h2>
              <div className="attempts-list">
                {fetch_attempts_loading ?
                  (
                    <div className="attempt-card skeleton">
                      <div className="skeleton-header">
                        <div className="skeleton-title"></div>
                        <div className="skeleton-score"></div>
                      </div>
                      <div className="skeleton-line"></div>
                      <div className="skeleton-line"></div>
                    </div>
                  ) : (
                    attempts.length ?
                      attempts.map((attempt, index) => {
                        return (
                          <div key={index} className="attempt-card">
                            <div className="attempt-header">
                              <h3>{quizName[attempt.id]}</h3>
                              <span className="score" style={{ backgroundColor: `${percentage_color(100 * attempt.correct / (attempt.correct + attempt.wrong + attempt.unattempted))}` }}>{100 * attempt.correct / (attempt.correct + attempt.wrong + attempt.unattempted)}%</span>
                            </div>
                            <p className="attempt-date">Completed on <b><i> {timeAgo(attempt.timestamp)}</i></b></p>
                            <p className="creater"> Created by <b><i>{createrName[attempt.id]}</i></b></p>
                          </div>
                        )
                      }) : (
                        <p>No attempts yet!</p>
                      )
                  )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile
