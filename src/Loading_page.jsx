import React from 'react'
import "./Loading_page.css"

const Loading_page = () => {
  return (
    <div className='loading-container'>
      <div className='spinner'></div>
      <p className='loading-text'>Loading...</p>
    </div>
  )
}

export default Loading_page
