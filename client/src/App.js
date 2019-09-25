import React from 'react';
import axios from 'axios';
import { StreamChat } from 'stream-chat';
import './App.css';

class App extends React.Component {
  constructor() {
    super()
    this.state = {
      username: '',
      token: '',
      hasJoinedChat: false,
      user: null,
      channel: null,
      client: null,
      messages: [],
      newMessage: '',
    }
  }

  handleChange = (event) => {
    const { value, name } = event.target;

    this.setState({
      [name]: value
    });
  }

  joinChat = (event) => {
    event.preventDefault();
    const { username } = this.state;
    axios.post('http://localhost:5200/join', {
      username,
    })
      .then(response => {
        console.log(response);
        const { data } = response;
        console.log(data)
        this.setState({
          username: '',
          user: {
            username: data.username
          },
          token: data.token,
        }, () => {
          this.initializeStream(data);
        })
      })
      .catch(console.error)
  }

  initializeStream = data => {
    const { username } = data;
    let { token } = data;
    console.log(username, token);
    const client = new StreamChat('z264395ksptg');

    client.setUser({ id: username, name: username }, token)
      .then(() => {
        const channel = client.channel("messaging", "react-chat", {
          name: "React Chat"
        });

        const room = channel.watch();
        this.setState({
          client,
          channel,
          hasJoinedChat: true,
          messages: room.messages,
        });
      }).catch(console.error)
  }

  sendMessage = (event) => {
    event.preventDefault();

    const { channel, newMessage } = this.state;
    channel.sendMessage({
      text: newMessage
    });

    this.setState({
      newMessage: ""
    });
  }

  render() {
    const { hasJoinedChat, username, messages, newMessage } = this.state;

    const messageList = messages.map(message => {
      return (
        <li className="message" key={message.id}>
          <span className="user-id">{message.user.id}</span>
          <span className="message-text">{message.text}</span>
        </li>
      )
    });

    return (
      <div className="App">
        {!hasJoinedChat ? (
          <div className="login-form">
            <h2>Join Chat</h2>
            <form onSubmit={this.joinChat}>
              <label htmlFor="username">Enter your username</label>
              <input type="text" onChange={this.handleChange} value={username} id="username" name="username" placeholder="Username" />
                <button type="submit">Join Chat</button>
              </form>
            </div>
        ) : (
          <div class="chat">
            <header>
              <h2>Chat Messages</h2>
            </header>
            <ul className="messages">
              {messageList}
            </ul>
            <form className="message-form" onSubmit={this.sendMessage}>
              <input type="text" onChange={this.handleChange} value={newMessage} name="newMessage" placeholder="Enter your message" />
            </form>
          </div>
          )}
      </div>
    )
  }
}

export default App;
