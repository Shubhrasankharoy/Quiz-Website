import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch, faEarthAsia, faTrash, faTimes } from "@fortawesome/free-solid-svg-icons";
import { auth, db } from './firebaseConfig'
import { addDoc, collection, updateDoc, arrayUnion, doc, getDocs } from 'firebase/firestore';
import "./Updated_home.css"
import Navbar from './Navbar';
import Alert from './Alert';

const Updated_home = () => {
    const [submit_loading, setSubmit_loading] = useState(false);
    const [search, setSearch] = useState("");
    const [quiz_name, setQuiz_name] = useState("");
    const [timer, setTimer] = useState('');
    const [show_quiz_form, setShow_quiz_form] = useState(false);
    const [questions, setQuestions] = useState([{
        question: "",
        options: ["", "", "", ""],
        answer: null
    }])
    const [quizzes, setQuizzes] = useState([]);
    const [show_alert, setShow_alert] = useState(false);
    const [alert_message, setAlert_message] = useState("");
    const [go_to_attemp_page, setGo_to_attemp_page] = useState(false);
    const searchRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        document.title = "Home - Explore Exciting Quizzes";
    }, []);

    const fetch_quizzes = async () => {
        try {
            const querySnapshot = await getDocs(collection(db, "quizzes"));
            let quizzes_list = [];

            querySnapshot.forEach((doc) => {
                let quiz_data = doc.data();
                quizzes_list.push({
                    id: doc.id,
                    ...quiz_data,
                    total_attempts: quiz_data.total_attempts ?? 0,
                    timer: quiz_data.timer ?? 'No Limit',
                });
            });

            quizzes_list.sort((a, b) => b.total_attempts - a.total_attempts);

            setQuizzes(quizzes_list);
        } catch (error) {
            console.error("Error fetching quizzes:", error);
        }
    };

    useEffect(() => {
        fetch_quizzes();
    }, [])

    useEffect(() => {
        if (show_quiz_form || show_alert) {
            document.body.classList.add("no-scroll");
        } else {
            document.body.classList.remove("no-scroll");
        }
        return () => {
            document.body.classList.remove("no-scroll");
        };
    }, [show_quiz_form, show_alert]);

    const open_pop_up = () => {
        setShow_quiz_form(true);
    }

    const close_pop_up = () => {
        setShow_quiz_form(false);
    }

    const handle_question_change = (index, e) => {
        const new_questions = [...questions];
        new_questions[index].question = e.target.value;
        setQuestions(new_questions);
    }

    const handle_option_change = (q_index, opt_index, e) => {
        const new_questions = [...questions];
        new_questions[q_index].options[opt_index] = e.target.value;
        setQuestions(new_questions);
    }

    const handle_answer_change = (q_index, opt_index) => {
        setQuestions(prevQuestions => {
            const newQuestions = [...prevQuestions];
            newQuestions[q_index] = {
                ...newQuestions[q_index],
                answer: opt_index,
            };
            return newQuestions;
        });
    };

    const handle_delete_question = (index) => {
        setQuestions(questions.filter((_, q_index) => q_index != index))
    }

    const add_new_question = () => {
        setQuestions([...questions, { question: "", options: ["", "", "", ""], answer: null }]);
    }

    const handle_submit = async (e) => {
        e.preventDefault();

        if (!auth.currentUser) {
            alert("Please login to submit quiz")
            return;
        }

        if (quiz_name.trim() === "" || questions.length === 0) {
            alert("Quiz name and at least one question are required.");
            return;
        }

        for (let index = 0; index < questions.length; index++) {
            const question = questions[index];
            if (question.answer == null) {
                setAlert_message(`Please select an answer for question ${(index + 1)}`);
                setShow_alert(true);
                return;
            }
        }

        if (timer <= 1) {
            alert("Timer must be greater than 1min");
            return;
        }

        setSubmit_loading(true);

        try {
            const quiz_ref = await addDoc(collection(db, "quizzes"), {
                user_id: auth.currentUser.uid,
                quiz_name: quiz_name,
                questions: questions,
                total_attempts: 0,
                timer: Number(timer),
            })

            const user_ref = doc(db, "users", auth.currentUser.uid);
            await updateDoc(user_ref, {
                quizzes: arrayUnion(quiz_ref.id)
            })

            setQuiz_name("");
            setQuestions([{ question: "", options: ["", "", "", ""], answer: null }])
            fetch_quizzes();
            console.log("Quiz successfully created with ID:", quiz_ref.id);
            setShow_quiz_form(false);
        } catch (error) {
            console.log(error);
            alert(error)
        }

        setSubmit_loading(false);
    }

    const handle_click_quiz = (quiz) => {
        setAlert_message(
            <span>
                Are you sure you want to attempt the quiz <strong>"{quiz.quiz_name}"</strong>?
            </span>
        );
        setShow_alert(true);
        setGo_to_attemp_page(() => () => {
            window.open(`${window.location.origin}/Quiz-Website/#/attempt_quiz/${quiz.id}`, "_blank");
        });
    }

    const filteresQuizzes = quizzes.filter((quiz) =>
        quiz.quiz_name.toLowerCase().includes(search.toLocaleLowerCase())
    );

    return (
        <div>
            <div className={`home-whole-body`} >
                <Navbar />
                <div className="home-body">
                    <div className="search-container">
                        <div className="box">
                            <h1>Discover quizzes on your favorite topics</h1>
                            <div className="quiz-search-box">
                                <FontAwesomeIcon icon={faSearch} />
                                <input ref={searchRef} type="text" placeholder="Search for quizzes" value={search} onChange={(e) => setSearch(e.target.value)} />
                                <button className="search-btn">Search</button>
                                <div className="search-result-container">
                                    {filteresQuizzes.length > 0 && search != "" ? (
                                        filteresQuizzes.map((quiz) => (
                                            <div className="search-result-box" key={quiz.id} onClick={() => { handle_click_quiz(quiz) }}>
                                                <h1>{quiz.quiz_name}</h1>
                                            </div>
                                        ))
                                    ) : (
                                        <></>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="btn-container">
                        <h1>Create and share your own quizzes</h1>
                        <p>Or take a quiz that's been created by someone else</p>
                        <div className="btn-box">
                            <button className='create-btn' onClick={open_pop_up}>Create a Quiz</button>
                            <button className='attempt-btn' onClick={() => { searchRef.current.focus() }}>Attempt a Quiz</button>
                        </div>
                    </div>
                    <div className="all-quizzes">
                        <h2>Top Quizzes:</h2>
                        {quizzes.length > 0 ? (
                            quizzes.map((quiz) => (
                                <div key={quiz.id} className="quiz-box" onClick={() => { handle_click_quiz(quiz) }}>
                                    <div className="icon">
                                        <FontAwesomeIcon icon={faEarthAsia} />
                                    </div>

                                    <div className="quiz-name">
                                        <h4>{quiz.quiz_name}</h4>
                                        <p>{quiz.questions.length} questions</p>
                                    </div>

                                    <div className="attempts">
                                        <p>Attempts: {quiz.total_attempts ?? 0}</p>
                                        <p>Time: {quiz.timer === "No Limit" ? "Unlimited" : `${quiz.timer} min`}</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p>No quizzes available</p>
                        )}
                    </div>
                </div>
            </div>
            {show_quiz_form &&
                <div className="create-quiz-body">
                    <div className="create-quiz-container">
                        <form onSubmit={(e) => { handle_submit(e) }}>
                            <div className="quiz-name">
                                <input type="text" placeholder='Enter your quiz name' value={quiz_name} onChange={(e) => { setQuiz_name(e.target.value) }} required />
                            </div>
                            <label>Set Timer (minutes):</label>
                            <input type='number' placeholder='Enter time in minutes' value={timer} onChange={(e) => setTimer(e.target.value)} />
                            <div className="heading">
                                <h4>What's your question?</h4>
                                <p>Enter your question and answer options below</p>
                            </div>

                            <div className="questions">
                                {questions.map((q, q_index) => (
                                    <div key={q_index} className="question">
                                        <label>Question {q_index + 1}</label>
                                        <input type="text" placeholder='Ask your question here' value={q.question} onChange={(e) => { handle_question_change(q_index, e) }} required />
                                        {q.options.map((opt, opt_index) => (
                                            <div key={opt_index} className='option'>
                                                <input type="text" placeholder={`Option ${opt_index + 1}`} value={opt} onChange={(e) => { handle_option_change(q_index, opt_index, e) }} required />
                                                <input type="radio" name={`ques-${q_index}-answer-${opt_index}`} value={opt_index} checked={q.answer === opt_index} onChange={e => { handle_answer_change(q_index, opt_index) }} />
                                            </div>
                                        ))}
                                        <FontAwesomeIcon icon={faTrash} className='trash' onClick={() => handle_delete_question(q_index)} />
                                    </div>
                                ))}
                            </div>
                            <div className="btns">
                                <button type='button' className='add-question-btn' onClick={add_new_question}>Add Question</button>
                                <button type='submit' className='submit-btn'>
                                    {submit_loading ? "Saving..." : "Submit"}
                                </button>
                            </div>
                        </form>
                    </div>
                    <div className="cross-btn" onClick={close_pop_up}>
                        <FontAwesomeIcon icon={faTimes} className='cross' />
                    </div>
                </div>
            }




            {show_alert && (
                <Alert
                    message={alert_message}
                    onConfirm={() => {
                        if (go_to_attemp_page) go_to_attemp_page();
                        setShow_alert(false);
                    }}
                    onCancel={() => {
                        setGo_to_attemp_page(false);
                        setShow_alert(false);
                    }}
                />)}
        </div>
    )
}

export default Updated_home
