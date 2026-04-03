import React, { createContext, useContext, useState, useCallback } from "react";

const UserValuesContext = createContext(null);

export const UserValuesProvider = ({ children }) => {
  const [displayedIssues, setDisplayedIssues] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // ✅ ADD NEW ISSUE (TOP LA INSERT + DUPLICATE AVOID)
  const addNewIssue = useCallback((newIssue) => {
    setDisplayedIssues((prev) => {
      const exists = prev.some((issue) => issue._id === newIssue._id);
      if (exists) return prev;

      return [
        {
          ...newIssue,
          likes: newIssue.likes || [],
          likeCount:
            newIssue.likeCount ?? newIssue.likes?.length ?? 0,
          comments: newIssue.comments || [],
        },
        ...prev,
      ];
    });
  }, []);

  // ✅ UPDATE ISSUE (LIKE + GENERAL UPDATE FIX)
  const updateIssue = useCallback((issueId, updates) => {
    setDisplayedIssues((prev) =>
      prev.map((issue) => {
        if (issue._id !== issueId) return issue;

        const updatedLikes = updates.likes ?? issue.likes ?? [];

        return {
          ...issue,
          ...updates,
          likes: updatedLikes,
          likeCount:
            updates.likeCount ??
            updatedLikes.length ??
            issue.likeCount ??
            0,
        };
      })
    );
  }, []);

  // ✅ COMMENTS UPDATE
  const updateComments = useCallback((issueId, newComments) => {
    setDisplayedIssues((prev) =>
      prev.map((issue) =>
        issue._id === issueId
          ? { ...issue, comments: newComments || [] }
          : issue
      )
    );
  }, []);

  // ✅ SINGLE COMMENT UPDATE
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