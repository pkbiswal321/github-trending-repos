import React, { useState, useEffect } from 'react';
import axios from 'axios';
import moment from 'moment';
import './App.css';

function App() {
  const [repos, setRepos] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const fetchRepos = async () => {
    try {
      setLoading(true);
      const tenDaysAgo = moment().subtract(10, 'days').format('YYYY-MM-DD');
      
      // Log when fetching a new page
      console.log(`Fetching page ${page}...`);
      
      const response = await axios.get(
        `https://api.github.com/search/repositories?q=created:>${tenDaysAgo}&sort=stars&order=desc&page=${page}`
      );
      
      console.log(`Page ${page} data:`, response.data);
      
      // Add page information to each repository item to ensure unique keys
      const newRepos = response.data.items.map(item => ({
        ...item,
        uniqueId: `${item.id}-${page}`
      }));
      setRepos(prevRepos => {
        // Filter out any duplicates based on repository ID
        const existingIds = new Set(prevRepos.map(repo => repo.id));
        const filteredNewRepos = newRepos.filter(repo => !existingIds.has(repo.id));
        return [...prevRepos, ...filteredNewRepos];
      });
      setLoading(false);
    } catch (error) {
      console.error('Error fetching repos:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRepos();
  }, [page]);

  const handleScroll = () => {
    // Add some buffer (100px) to trigger loading before reaching the very bottom
    if (
      window.innerHeight + document.documentElement.scrollTop + 100 >=
      document.documentElement.offsetHeight
    ) {
      console.log('Scroll position:', {
        windowHeight: window.innerHeight,
        scrollTop: document.documentElement.scrollTop,
        totalHeight: document.documentElement.offsetHeight
      });
      
      if (!loading) {  // Only load more if we're not currently loading
        console.log('Reached near bottom of page, loading more...');
        setPage(prevPage => {
          console.log('Incrementing page from', prevPage, 'to', prevPage + 1);
          return prevPage + 1;
        });
      }
    }
  };

  useEffect(() => {
    const throttledHandleScroll = () => {
      // Throttle scroll events to prevent too many calls
      if (!throttledHandleScroll.timeoutId) {
        throttledHandleScroll.timeoutId = setTimeout(() => {
          handleScroll();
          throttledHandleScroll.timeoutId = null;
        }, 200);
      }
    };

    window.addEventListener('scroll', throttledHandleScroll);
    return () => {
      window.removeEventListener('scroll', throttledHandleScroll);
      if (throttledHandleScroll.timeoutId) {
        clearTimeout(throttledHandleScroll.timeoutId);
      }
    };
  }, [loading]); // Add loading to dependencies

  return (
    <div className="App">
      <header className="app-header">
        <h1>Trending Repos</h1>
      </header>
      <div className="repo-list">
        {repos.map((repo) => (
          <div key={repo.uniqueId} className="repo-item">
            <div className="repo-header">
              <div className="owner-info">
                <img src={repo.owner.avatar_url} alt="Owner avatar" className="avatar" />
                <span className="username">{repo.owner.login}</span>
              </div>
              <div className="stars">
                <span role="img" aria-label="stars">⭐</span>
                {repo.stargazers_count}
              </div>
            </div>
            <div className="repo-body">
              <h2>
                <a 
                  href={repo.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="repo-link"
                >
                  {repo.name}
                </a>
              </h2>
              <p>{repo.description}</p>
            </div>
          </div>
        ))}
      </div>
      {loading && <div className="loading">Loading...</div>}
    </div>
  );
}

export default App;
