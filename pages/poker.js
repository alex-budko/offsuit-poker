import { useEffect, useState } from "react";
import io from "socket.io-client";

function poker() {
    useEffect(() => {
        fetch('/api/socket').finally(() => {
          const socket = io()
    
          socket.on('connect', () => {
            console.log('connect')
            socket.emit('hello')
          })
    
          socket.on('hello', data => {
            console.log('hello', data)
          })
    
          socket.on('a user connected', () => {
            console.log('a user connected')
          })
    
          socket.on('disconnect', () => {
            console.log('disconnect')
          })
        })
      }, [])

  return (
    <h1>Hi</h1>
  );
}

export default poker;
