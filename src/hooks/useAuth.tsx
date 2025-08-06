import { PostAuthResponse } from "@/lib/kubb";
import { useEffect, useState } from "react"
import { api  } from "@/utils"



const loadCredentials = async (response : PostAuthResponse ) => {
  try {
      console.log("Loading creds")
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.setItem('access_token', response.access_token!);
      localStorage.setItem('refresh_token', response.refresh_token!);
      return response;
  } catch (error) {
      console.error("Error signing in:", error);
      throw error;
  }
};

const signOut = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  window.location.href = '/'; 
}


export { loadCredentials, signOut}

