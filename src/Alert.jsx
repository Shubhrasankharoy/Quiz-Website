import React from "react";
import "./Alert.css";

const Alert = ({ message, onConfirm, onCancel }) => {
  return (
    <div className="alert-overlay">
      <div className="alert-box">
        <p>{message}</p>
        <div className="buttons">
          <button className="ok-btn" onClick={onConfirm}>
            OK
          </button>
          <button className="cancel-btn" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default Alert;
