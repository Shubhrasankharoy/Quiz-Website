import React, { useState } from 'react'
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch } from "@fortawesome/free-solid-svg-icons";
import "./Search_result_display.css"

const Search_result_display = (value) => {
    const [search, setSearch] = useState(value ? value : "");

    return (
        <div className='search-display-container'>
            <div className="input-nav">
                <FontAwesomeIcon icon={faSearch} />
                <input 
                type="text" 
                placeholder="Search..." 
                value={search}
                />
            </div>
        </div>
    )
}

export default Search_result_display
