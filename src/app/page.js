"use client"

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button"
import FingerprintJS from '@fingerprintjs/fingerprintjs';

import Image from "next/image";
import VoteButton from "@/components/custom/votebutton"
import { parse } from "dotenv";

export default function Main() {
    const [loading, setLoading] = useState(true);
    const [fadeOut, setFadeOut] = useState(false);
    const [title, setTitle] = useState("");
    const [footer, setFooter] = useState("");
    const [registerBtn_name, setRegisterBtn_name] = useState("");
    const [mode, setMode] = useState("");
    const [voteButtons, setVoteButtons] = useState([]);
    const [tabTitle, setTabTitle] = useState("");

    const [showThanksTitle, setShowThanksTitle] = useState(false);
    const [thanksTitle, setThanksTitle] = useState("");

    const [showVotedOn, setShowVotedOn] = useState({});
    const [votedOnTitle, setVotedOnTitle] = useState("");
    const [votedOnIndex, setVotedOnIndex] = useState(0);
    const [votedOnSub, setVotedOnSub] = useState("");

    const [showLeading, setShowLeading] = useState(false);
    const [leadingTitle, setLeadingTitle] = useState("");

    const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];

    useEffect(() => {
        const initialize = async () => {
            fetch(`/api/gethomepage`)
            .then(response => response.json())
            .then(data => {

                setFooter(data.footer);
                setTabTitle(data.tabTitle);
                
                const localStorageVoterId = localStorage.getItem('voterId');
                const cookieVoterId = document.cookie.split(';').find(item => item.trim().startsWith('voterId='));
                if(data.mode === "vote" && (localStorage.getItem('hasVoted') === 'true' || document.cookie.split(';').some((item) => item.trim().startsWith('hasVoted=')) || (cookieVoterId && localStorageVoterId !== cookieVoterId.split('=')[1]))) {
                    if(localStorage.getItem('hasVoted') === 'true' && localStorage.getItem('votedOnIndex')) {
                        setMode("thankYou");
                        setShowThanksTitle(true);
                        setThanksTitle(data.thankYou.title);

                        setVoteButtons(data.votingoptions);

                        setShowVotedOn(data.thankYou.showVotedOn);
                        setVotedOnTitle(data.thankYou.votedOnTitle);
                        setVotedOnIndex(localStorage.getItem('votedOnIndex'));
                        setVotedOnSub(data.thankYou.votedOnSub);

                        setShowLeading(data.thankYou.showLeading);
                        setLeadingTitle(data.thankYou.leadingTitle);

                        setFadeOut(true);
                        setTimeout(() => {
                            setLoading(false); 
                        }, 200);

                    } else {
                        setMode("alreadyVoted");

                        setFadeOut(true);
                        setTimeout(() => {
                            setLoading(false);
                        }, 200);
                    }

                } else {
                    setTitle(data.title);
                    setRegisterBtn_name(data.registerBtn_name);
                    setMode(data.mode);
                    setVoteButtons(data.votingoptions);
    
                    setFadeOut(true);
                    setTimeout(() => {
                        setLoading(false);
                    }, 200);
                }

            })
            .catch(error => {
                console.error('Error fetching data:', error);
            });
            
            const voterId = localStorage.getItem('voterId');
            if (mode === "vote" && voterId && !localStorage.getItem('votedOnIndex')) {
                fetch(`/api/checkvote?voterId=${voterId}`)
                    .then(response => response.json())
                    .then(data => {
                        if (data.alreadyVoted) {
                            setMode("alreadyVoted");
                        }
                    })
                    .catch(error => {
                        console.error('Error fetching data:', error);
                    });
            }

            if (mode === "vote" && !localStorage.getItem('voterId')) {
                const voterId = generateVoterId();
                document.cookie = `voterId=${voterId}; max-age=31536000; path=/`;
                localStorage.setItem('voterId', voterId);
            }
        };

        initialize();
    }, []);

    function generateVoterId() {
        return 'xxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    async function handleVote(index) {
        let voterId = localStorage.getItem('voterId') || generateVoterId();
        console.log(voterId);

        if (!voterId) {
            console.error('Error generating voter ID');
            return;
        }

        let data = {
            index: index,
            voterId: voterId
        };

        fetch('/api/sendvote', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Referrer: 'homepage' },
            body: JSON.stringify(data),
        })
            .then(response => {
                if (response.status === 400) {
                    setMode("alreadyVoted");
                    return response.json();
                }
                return response.json();
            })
            .then(() => {
                console.log('Vote submitted:', index);
                localStorage.setItem('votedOnIndex', index);
                localStorage.setItem('hasVoted', 'true');
                document.cookie = "hasVoted=true; max-age=31536000; path=/";
                window.location.reload();
            })
            .catch((error) => {
                console.error('Error submitting vote:', error);
            });
    }

    function parseLabel(label) {
        const regex = /<a\s+href=(['"])(.*?)\1>(.*?)<\/a>/g
        const parts = []
        let lastIndex = 0
        let match

        while ((match = regex.exec(label)) !== null) {
            if (match.index > lastIndex) {
                parts.push(label.substring(lastIndex, match.index))
            }
            parts.push(
                <a href={match[2]} key={match.index} className="text-gray-900 underline">
                    {match[3]}
                </a>
            )
            lastIndex = match.index + match[0].length
        }

        if (lastIndex < label.length) {
            parts.push(label.substring(lastIndex))
        }

        return parts
    }

    return (
        <div className="flex flex-col items-center min-h-screen bg-[#1e1e1e] relative">
            <title>{tabTitle}</title>
            {loading && (
                <div className={`preloader fixed inset-0 flex items-center justify-center bg-[#1e1e1e] ${fadeOut ? 'fade-out' : ''}`}>
                    <svg className="spinner" viewBox="0 0 50 50">
                        <circle className="path" cx="25" cy="25" r="20" fill="none" strokeWidth="2"></circle>
                    </svg>
                    <style jsx>{`
                        .fade-out {
                            animation: fade-out 0.2s ease-in-out;
                        }

                        @keyframes fade-out {
                            from { opacity: 1; }
                            to { opacity: 0; }
                        }

                        .spinner {
                            animation: rotate 2s linear infinite;
                            z-index: 2;
                            position: absolute;
                            top: 50%;
                            left: 50%;
                            margin: -25px 0 0 -25px;
                            width: 50px;
                            height: 50px;
                        }

                        .spinner .path {
                            stroke: hsl(138deg 0% 100%);
                            stroke-linecap: round;
                            animation: dash 1.5s ease-in-out infinite;
                        }

                        @keyframes rotate {
                            100% {
                                transform: rotate(360deg);
                            }
                        }

                        @keyframes dash {
                            0% {
                                stroke-dasharray: 1, 150;
                                stroke-dashoffset: 0;
                            }
                            50% {
                                stroke-dasharray: 90, 150;
                                stroke-dashoffset: -35;
                            }
                            100% {
                                stroke-dasharray: 90, 150;
                                stroke-dashoffset: -124;
                            }
                        }
                    `}</style>
                </div>
            )}
            {!loading && (
                <>
                    <div className="flex justify-center items-center mt-10">
                        <div className="border border-transparent max-w-[64rem] w-full p-6 text-center">
                            <Image
                                className="invert mx-auto"
                                src="/next.svg"
                                alt="Next.js logo"
                                width={180}
                                height={38}
                                priority
                                onClick={() => {
                                    localStorage.clear();
                                    window.location.reload();
                                }}
                            />
                            <h2 id="title" className="mt-4 text-gray-200 break-words">{showThanksTitle ? thanksTitle : title}</h2>
                            {mode === "register" ? (
                                <Button variant="secondary" className="mt-12" onClick={() => window.location.href = '/register'}>{registerBtn_name}</Button>
                            ) : mode === "vote" ? (
                                <div className="mt-12 flex flex-col items-center">
                                    {voteButtons.map((voteButton, index) => (
                                        <VoteButton letter={letters[index]} key={index} color={voteButton.color} subtext={voteButton.subtext}
                                            onClick={() => handleVote(index)}
                                        >{voteButton.name}</VoteButton>
                                    ))}
                                </div>
                            ) : mode === "alreadyVoted" ? (
                                <>alreadyVoted</>
                            ) : mode === "thankYou" ? (
                                <div className="flex flex-col items-center">
                                    <div className="animation-ctn mt-6">
                                        <div className="icon icon--order-success svg">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="154px" height="154px">
                                                <g fill="none" stroke="#22AE73" strokeWidth="2">
                                                    <circle cx="77" cy="77" r="72" style={{ strokeDasharray: '480px, 480px', strokeDashoffset: '960px' }}></circle>
                                                    <circle id="colored" fill="#22AE73" cx="77" cy="77" r="72" style={{ strokeDasharray: '480px, 480px', strokeDashoffset: '960px' }}></circle>
                                                    <polyline className="st0" stroke="#fff" strokeWidth="10" points="43.5,77.8 63.7,97.9 112.2,49.4" style={{ strokeDasharray: '100px, 100px', strokeDashoffset: '200px' }}></polyline>
                                                </g>
                                            </svg>
                                        </div>
                                    </div>
                                    {showVotedOn && (
                                        <div className="text-gray-50 mt-8">
                                            <p className="mb-3">{votedOnTitle}</p>
                                            <VoteButton letter={letters[votedOnIndex]} color={voteButtons[votedOnIndex].color} subtext={voteButtons[votedOnIndex].subtext} disabled>{voteButtons[votedOnIndex].name}</VoteButton>
                                            <p className="mt-3 text-gray-300">
                                                {(() => {
                                                    let percentage = 0;
                                                    if (voteButtons[votedOnIndex].votes > 0) {
                                                        percentage = Math.round((voteButtons[votedOnIndex].votes / voteButtons.reduce((acc, curr) => acc + curr.votes, 0)) * 100);
                                                    }
                                                    return votedOnSub.replace('(%)', percentage + '%');
                                                })()}
                                            </p>
                                        </div>
                                    )}
                                    {showLeading && (() => {
                                        let maxVotes = Math.max(...voteButtons.map(button => button.votes));
                                        let leadingButton = voteButtons.find(button => button.votes === maxVotes);

                                        if (leadingButton && voteButtons[votedOnIndex].votes !== maxVotes) {
                                            let percentage = Math.round((leadingButton.votes / voteButtons.reduce((acc, curr) => acc + curr.votes, 0)) * 100);

                                            return (
                                                <div className="text-gray-50 mt-8 flex flex-col items-center">
                                                    <p className="mb-3">{leadingTitle.replace('(%)', '(' + percentage + '%)')}</p>
                                                    <VoteButton letter={letters[voteButtons.indexOf(leadingButton)]} color={leadingButton.color} subtext={leadingButton.subtext} disabled>{leadingButton.name}</VoteButton>
                                                </div>
                                            );
                                        }
                                        return null;
                                    })()}
                                </div>
                            ) : null}
                        </div>
                    </div>
                    <footer className="w-full bg-[#404040] text-[#c0c0c0] pt-1.5 text-center text-sm h-8 mt-auto">
                        {parseLabel(footer)}
                    </footer>
                </>
            )}
        </div>
    );
};