import React from 'react';
import axios from 'axios';
import { useState } from 'react';


function CreationStation() { 
    


        return (
        <div>
            <h1>Create A Drink</h1>
            <br />
            <br />
            <button>New Ingredients</button>
            {' '}
            <button>My Saved Recipes</button>
            <br />
            <br />
            <img src="data:image/jpeg;base64,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" alt="" />
            <br />
            <br />
            <h2>List of Active Ingredients</h2>
            <h4>Remove An Ingredient By Clicking The  '✖️'  Next To It</h4>
            <ul>
                <li>Vodka<span>✖️</span></li>
                <li>Ciroc<span>✖️</span></li>
                <li>Gin<span>✖️</span></li>
                <li>Casamigos<span>✖️</span></li>
                <li>Margarita<span>✖️</span></li>
            </ul>
            <br />
            <br />
            <h2>Give Your Drink A Name</h2>
            <input type="text" placeholder='Type it here!'/>
            <br />
            <br />
            <br />
            <button>Save to My Collection!</button>
        </div>
        )

    
    
    
}

export default CreationStation