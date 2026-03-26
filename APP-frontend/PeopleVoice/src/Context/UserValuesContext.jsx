import React, { createContext, useContext, useState, useCallback } from "react";

const UserValuesContext = createContext(null);

export const UserValuesProvider = ({ children }) => {
  const [displayedIssues, setDisplayedIssues] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const addNewIssue = useCallback((newIssue) => {
    setDisplayedIssues((prev) => [newIssue, ...prev]);
  }, []);

  const updateIssue = useCallback((issueId, updates) => {
    setDisplayedIssues((prev) =>
      prev.map((issue) =>
        issue._id === issueId
          ? { ...issue, ...updates, likes: updates.likes ?? issue.likes ?? [] }
          : issue
      )
    );
  }, []);


  const updateComments = useCallback((issueId, newComments) => {
    setDisplayedIssues((prev) =>
      prev.map((issue) =>
        issue._id === issueId
          ? { ...issue, comments: newComments || [] }
          : issue
      )
    );
  }, []);

  const updateComment = useCallback((issueId, commentId, updates) => {
    setDisplayedIssues((prev) =>
      prev.map((issue) => {
        if (issue._id !== issueId) return issue;

        const updatedComments = (issue.comments || []).map((c) =>
          c._id === commentId ? { ...c, ...updates } : c
        );

        return { ...issue, comments: updatedComments };
      })
    );
  }, []);

  return (
    <UserValuesContext.Provider
      value={{
        displayedIssues,
        setDisplayedIssues,
        isLoading,
        setIsLoading,
        addNewIssue,
        updateIssue,
        updateComments,
        updateComment,
      }}
    >
      {children}
    </UserValuesContext.Provider>
  );
};

export const useUserValues = () => {
  const ctx = useContext(UserValuesContext);
  if (!ctx) throw new Error("useUserValues must be used inside provider");
  return ctx;
};