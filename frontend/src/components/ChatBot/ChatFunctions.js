import axios from 'axios'

export function getGeminiResponse(msg){
    const authToken = sessionStorage.getItem('authToken' || '')
    let apiUrl = `http://localhost:8080/chat?secret_token=${authToken}&message=${msg}`
    return axios.post(apiUrl)
}