import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import { auth, db } from "./firebaseConfig";
import { doc, getDoc, collection, addDoc, getDocs, where, updateDoc, arrayUnion, increment, query } from "firebase/firestore";
import Loading_page from './Loading_page';
import Navbar from './Navbar';
import Alert from './Alert';
import "./Attempt_quiz.css";

const Attempt_quiz = () => {
    const { quiz_id } = useParams();
    const [quiz, setQuiz] = useState(null);
    const [timer, setTimer] = useState(null);
    const [time_left, setTime_left] = useState(null);
    const [current_question_index, setCurrent_question_index] = useState(0);
    const [answers, setAnswers] = useState({});
    const [attempting, setAttempting] = useState(true)
    const [is_submitting, setIs_submitting] = useState(false);
    const [is_submited, setIs_submited] = useState(false);
    const [correct, setCorrect] = useState(0);
    const [wrong, setWrong] = useState(0);
    const [unattempted, setUnattempted] = useState(0);
    const [alert_message, setAlert_message] = useState("");
    const [show_alert, setShow_alert] = useState(false);

    useEffect(() => {
        const fetch_quiz = async () => {
            try {
                const quiz_ref = doc(db, "quizzes", quiz_id);
                const quiz_snap = await getDoc(quiz_ref);

                if (quiz_snap.exists()) {
                    const quiz_data = quiz_snap.data();
                    setQuiz(quiz_data);

                    setTimer(quiz_data.timer ? quiz_data.timer * 60 : null);
                    setTime_left(quiz_data.timer ? quiz_data.timer * 60 : null);

                    if (quiz_data.attempts) {
                        const attempt_query = query(
                            collection(db, "quiz_attempts"),
                            where("__name__", "in", quiz_data.attempts),
                            where("user_id", "==", auth.currentUser.uid)
                        )
                        const attempt_snap = await getDocs(attempt_query);
                        if (!attempt_snap.empty) {
                            const attempt_data = attempt_snap.docs[0].data();
                            setAnswers(attempt_data.answers);
                            setCorrect(attempt_data.correct);
                            setWrong(attempt_data.wrong);
                            setUnattempted(attempt_data.unattempted);
                            setAttempting(false);
                            setIs_submited(true);
                        }
                    }
                } else {
                    console.log("Quiz not found");
                }
            } catch (error) {
                console.error("Error fetching quiz:", error);
            }
        };

        fetch_quiz();
    }, [quiz_id]);

    useEffect(() => {
        if (is_submited) {
            return;
        }
        if (time_left === 0) {
            handle_submit();
            return;
        } else {
            const interval = setInterval(() => {
                setTime_left(prevtime => (prevtime > 0 ? prevtime - 1 : 0))
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [time_left]);

    useEffect(() => {
        const handleBeforeUnload = (e) => {
            e.preventDefault();
            e.returnValue = "";
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, []);


    const handle_option_change = (questionIndex, optionIndex) => {
        setAnswers((prevAnswers) => ({
            ...prevAnswers,
            [questionIndex]: optionIndex
        }));
    };

    const alert_for_submit = () => {
        setAlert_message("Are you sure you want to submit?");
        setShow_alert(true);
    }

    async function handle_submit() {
        if (!auth.currentUser) {
            alert("You must be logged in to attempt quizzes.");
            return;
        }

        if (!quiz) return;

        setIs_submitting(true);

        let correct_count = 0, wrong_count = 0, unattempted_count = 0;
        try {
            console.log("User Answers:", answers);

            quiz.questions.forEach((question, index) => {
                if (answers[index] === undefined) {
                    unattempted_count++;
                } else if (answers[index] === question.answer) {
                    correct_count++;
                } else {
                    wrong_count++;
                }
            });

            const attemptRef = await addDoc(collection(db, "quiz_attempts"), {
                quiz_id: quiz_id,
                user_id: auth.currentUser.uid,
                correct: correct_count,
                wrong: wrong_count,
                unattempted: unattempted_count,
                answers: answers,
                timestamp: new Date()
            });

            const userRef = doc(db, "users", auth.currentUser.uid);
            await updateDoc(userRef, {
                attempts: arrayUnion(attemptRef.id)
            });

            const quizRef = doc(db, "quizzes", quiz_id);
            await updateDoc(quizRef, {
                attempts: arrayUnion(attemptRef.id),
                total_attempts: increment(1),
            });

        } catch (error) {
            console.error("Error submitting quiz:", error);
            alert("Submission failed. Please try again.");
        } finally {
            setCorrect(correct_count);
            setWrong(wrong_count);
            setUnattempted(unattempted_count);
            setIs_submitting(false);
            setAttempting(false);
            setIs_submited(true);
        }
    };

    const handle_prev_question = () => {
        if (current_question_index > 0) {
            setCurrent_question_index(current_question_index - 1);
        }
    }

    const handle_uncheck = (questionIndex) => {
        setAnswers((prevAnswers) => {
            const updated_answer = { ...prevAnswers };
            delete updated_answer[questionIndex];
            return updated_answer;
        });
    }

    const handle_next_question = () => {
        if (current_question_index < quiz.questions.length - 1) {
            setCurrent_question_index(current_question_index + 1);
        }
    }

    const handle_alert_confirm = () => {
        handle_submit();
        setShow_alert(false);
    }

    const handle_alert_cancel = () => {
        setShow_alert(false);
    }

    const percentage_color = (parcentage) => {
        const red = Math.round(255 * (1 - parcentage / 100));
        const green = Math.round(255 * (parcentage / 100));
        const blue = 0;
        return `rgb(${red},${green},${blue})`
    }


    useEffect(() => {
        document.title = is_submited ? "Your Quiz Performance" : "Attempt Quiz - Show Your Skills";
    }, [is_submited]);

    if (!quiz) {
        return <Loading_page />;
    }

    return (

        <div className='attempt-quiz-body'>
            <Navbar is_attemting={attempting} />
            {!is_submited && (
                <div className={"main"}>
                    <div className='attempt-quiz-container'>
                        <div className="timer">
                            <p>Time Left: {time_left !== null ? `${String(Math.floor(time_left / 60)).padStart(2, '0')}:${String(time_left % 60).padStart(2, '0')}` : 'Unlimited'}</p>
                        </div>
                        <div className='attempt-quiz-tracker'>
                            <span>{Object.keys(answers).length}/{quiz.questions.length}</span>
                            <div className="attempt-bar">
                                <div className="attempt-bar-fill"
                                    style={{ width: `${(Object.keys(answers).length / quiz.questions.length) * 100}%` }}>
                                </div>
                            </div>
                        </div>
                        <h1>{quiz.quiz_name}</h1>
                        <div className="question">
                            <h3>Q{current_question_index + 1} ) {quiz.questions[current_question_index].question} </h3>
                            <div className="options">
                                {quiz.questions[current_question_index].options.map((option, opt_index) => (
                                    <div key={opt_index} className="option">
                                        <input
                                            type="radio"
                                            id={`option-${current_question_index}-${opt_index}`}
                                            name={`question-${current_question_index}`}
                                            value={opt_index}
                                            checked={answers[current_question_index] === opt_index}
                                            onChange={() => handle_option_change(current_question_index, opt_index)}
                                        />
                                        <label htmlFor={`option-${current_question_index}-${opt_index}`}>
                                            <div className="check-input"></div>
                                            <span>{option}</span>
                                        </label>
                                    </div>

                                ))}
                            </div>
                        </div>

                        <div className="question-change-btns">
                            <button className="btn" onClick={() => handle_prev_question()}>Previous</button>
                            <button className="btn" onClick={() => handle_uncheck(current_question_index)}>Uncheck</button>
                            <button className="btn" onClick={() => handle_next_question()}>Next</button>
                        </div>
                        <button className="submit-button" onClick={alert_for_submit} disabled={is_submitting}>
                            {is_submitting ? "Submitting..." : "Submit"}
                        </button>
                    </div>
                </div>
            )}

            {show_alert && <Alert message={alert_message} onConfirm={handle_alert_confirm} onCancel={handle_alert_cancel} />}

            {is_submited && (
                <div className="result-container">
                    <h1>{quiz.quiz_name}</h1>
                    <h2>Quiz Results</h2>
                    <p>You got {correct} out of {correct + wrong + unattempted} questions correct </p>

                    <div className="score-box">
                        <div>
                            <span>Your score:</span>
                            <span>{correct}/{correct + wrong + unattempted}</span>
                        </div>
                        <div className="score-bar">
                            <div className="score-bar-fill"
                                style={{
                                    width: `${100 * correct / (correct + wrong + unattempted)}%`,
                                    backgroundColor: percentage_color(100 * correct / (correct + wrong + unattempted))
                                }}>
                            </div>
                        </div>
                    </div>

                    {correct > 0 && (
                        <div className="corrects result-box">
                            <h5>Correct Answers({correct})</h5>
                            <ul>
                                {quiz.questions.map((question, index) => (
                                    answers[index] === question.answer ? (
                                        <li key={index}>
                                            <div>
                                                <strong>{index + 1}: </strong>{question.question}
                                            </div>
                                            <ol className="options">
                                                {question.options.map((option, opt_index) => (
                                                    <li key={opt_index} className={opt_index === question.answer ? 'option right-answer' : 'option'}>
                                                        <span>{option}</span>
                                                    </li>
                                                ))}
                                            </ol>
                                        </li>
                                    ) : null
                                ))}
                            </ul>
                        </div>
                    )}


                    {wrong > 0 && (
                        <div className="wrongs result-box">
                            <h5>Wrong Answers({wrong})</h5>
                            <ul>
                                {quiz.questions.map((question, index) => (
                                    answers[index] !== undefined && answers[index] !== question.answer ? (
                                        <li key={index}>
                                            <div>
                                                <strong>{index + 1}: </strong>{question.question}
                                            </div>
                                            <ol className="options">
                                                {question.options.map((option, opt_index) => {
                                                    let className = 'option';
                                                    if (opt_index === question.answer) {
                                                        className += ' right-answer';
                                                    } else if (opt_index === answers[index]) {
                                                        className += ' wrong-answer';
                                                    }

                                                    return (
                                                        <li key={opt_index} className={className}>
                                                            <span>{option}</span>
                                                        </li>
                                                    );
                                                })}
                                            </ol>
                                        </li>
                                    ) : null
                                ))}
                            </ul>
                        </div>
                    )}


                    {unattempted > 0 && (
                        <div className="unattempts result-box">
                            <h5>Not Attempted({unattempted})</h5>
                            <ul>
                                {quiz.questions.map((question, index) => (
                                    answers[index] === undefined ? (
                                        <li key={index}>
                                            <div>
                                                <strong>{index + 1}: </strong>{question.question}
                                            </div>
                                            <ol className="options">
                                                {question.options.map((option, opt_index) => (
                                                    <li key={opt_index} className={opt_index === question.answer ? 'option right-answer' : 'option'}>
                                                        <span>{option}</span>
                                                    </li>
                                                ))}
                                            </ol>
                                        </li>
                                    ) : null
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}

        </div>
    );
};

export default Attempt_quiz;
