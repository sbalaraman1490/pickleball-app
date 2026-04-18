import React, { useState } from 'react';
import { BookOpen, Target, Users, Scale, AlertCircle, CheckCircle, HelpCircle, Play } from 'lucide-react';
import './Rules.css';

function PickleballAnimation() {
  const [step, setStep] = useState(0);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setStep((prev) => (prev + 1) % 6);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const steps = [
    'Server prepares to serve',
    'Serve to diagonal court',
    'Return must bounce',
    'Serve team lets it bounce',
    'Volley at the net',
    'Point scored!'
  ];

  return (
    <div className="pickleball-animation">
      <div className="animation-status">{steps[step]}</div>
      <div className="court-container">
        <div className="court">
          {/* Court lines */}
          <div className="court-line baseline top"></div>
          <div className="court-line baseline bottom"></div>
          <div className="court-line sideline left"></div>
          <div className="court-line sideline right"></div>
          <div className="court-line center-line"></div>
          <div className="court-line kitchen-line top"></div>
          <div className="court-line kitchen-line bottom"></div>
          <div className="net"></div>
          
          {/* Kitchen zones */}
          <div className="kitchen-zone top">
            <span className="kitchen-label">KITCHEN</span>
          </div>
          <div className="kitchen-zone bottom">
            <span className="kitchen-label">KITCHEN</span>
          </div>
          
          {/* Players */}
          <div className={`player server ${step >= 0 ? 'active' : ''}`}>
            <div className="player-paddle"></div>
            <span className="player-label">Server</span>
          </div>
          <div className={`player receiver ${step >= 2 ? 'active' : ''}`}>
            <div className="player-paddle"></div>
            <span className="player-label">Receiver</span>
          </div>
          <div className={`player partner ${step >= 4 ? 'active' : ''}`}>
            <div className="player-paddle"></div>
            <span className="player-label">Partner</span>
          </div>
          
          {/* Ball */}
          <div className={`ball step-${step}`}></div>
          
          {/* Bounce markers */}
          <div className={`bounce bounce-1 ${step === 2 ? 'show' : ''}`}></div>
          <div className={`bounce bounce-2 ${step === 3 ? 'show' : ''}`}></div>
        </div>
      </div>
      <div className="animation-legend">
        <div className="legend-item">
          <span className="legend-color server-color"></span>
          <span>Serving Team</span>
        </div>
        <div className="legend-item">
          <span className="legend-color receiver-color"></span>
          <span>Receiving Team</span>
        </div>
        <div className="legend-item">
          <span className="legend-color kitchen-color"></span>
          <span>Non-Volley Zone</span>
        </div>
      </div>
    </div>
  );
}

function Rules() {
  const [activeSection, setActiveSection] = useState('basics');

  const sections = [
    { id: 'basics', label: 'What is Pickleball?', icon: HelpCircle },
    { id: 'howtoplay', label: 'How to Play', icon: Play },
    { id: 'rules', label: 'Basic Rules', icon: BookOpen },
    { id: 'scoring', label: 'Scoring', icon: Target },
    { id: 'serving', label: 'Serving', icon: Users },
    { id: 'kitchen', label: 'The Kitchen', icon: AlertCircle },
    { id: 'etiquette', label: 'Etiquette', icon: CheckCircle },
  ];

  const content = {
    howtoplay: {
      title: 'How to Play Pickleball',
      content: [
        {
          heading: 'Watch the Animation',
          text: 'See how a typical pickleball rally works. The animation shows the serve, the double bounce rule, and volleys at the net.'
        }
      ]
    },
    basics: {
      title: 'What is Pickleball?',
      content: [
        {
          heading: 'The Fastest Growing Sport',
          text: 'Pickleball is a paddle sport that combines elements of tennis, badminton, and ping-pong. It was invented in 1965 on Bainbridge Island, Washington, and has become one of the fastest-growing sports in the world.'
        },
        {
          heading: 'Easy to Learn, Fun to Play',
          text: 'Pickleball is played on a badminton-sized court with a modified tennis net. Players use solid paddles to hit a perforated plastic ball (similar to a wiffle ball) over the net. The game is easy for beginners to learn but can develop into a fast-paced, competitive game for experienced players.'
        },
        {
          heading: 'Why People Love It',
          points: [
            'Great exercise with less physical strain than tennis',
            'Social and community-oriented sport',
            'Can be played indoors or outdoors',
            'Suitable for all ages and skill levels',
            'Inexpensive equipment to get started',
            'Games are quick (usually 15-25 minutes)'
          ]
        }
      ]
    },
    rules: {
      title: 'Basic Rules of Pickleball',
      content: [
        {
          heading: 'The Court',
          text: 'A pickleball court is 20 feet wide and 44 feet long, the same size as a doubles badminton court. The net is 36 inches high at the sidelines and 34 inches in the middle.'
        },
        {
          heading: 'Key Rules',
          points: [
            'Games are played to 11 points, win by 2',
            'Only the serving team can score points',
            'Each side has a 7-foot "kitchen" (non-volley zone)',
            'The ball must bounce once on each side before volleys are allowed (double-bounce rule)',
            'Serves must be hit underhand and below the waist',
            'Serves must land in the diagonal service court',
            'Points continue until a fault occurs'
          ]
        },
        {
          heading: 'Faults (End the Rally)',
          points: [
            'Hitting the ball out of bounds',
            'Hitting the ball into the net',
            'Volleying from the kitchen',
            'Stepping into the kitchen to volley',
            'Double hitting the ball',
            'Touching the net with your body or paddle'
          ]
        }
      ]
    },
    scoring: {
      title: 'How Scoring Works',
      content: [
        {
          heading: 'Game Structure',
          text: 'Pickleball games are typically played to 11 points, and you must win by 2 points. Tournament games may be played to 15 or 21, still winning by 2.'
        },
        {
          heading: 'Calling the Score',
          text: 'In doubles, the score is called as three numbers: serving team score, receiving team score, and server number (1 or 2). Example: "4-3-1" means serving team has 4, receiving team has 3, and first server is serving.'
        },
        {
          heading: 'Singles Scoring',
          points: [
            'Only two numbers are called: server score, receiver score',
            'Server score is always called first',
            'When the server loses a rally, service goes to the opponent',
            'Server switches sides after scoring a point'
          ]
        },
        {
          heading: 'Doubles Scoring',
          points: [
            'Both partners serve before losing serve (except first serve of game)',
            'Server 1 serves until fault, then Server 2 serves',
            'After both fault, serve goes to opponent (side out)',
            'First serve of game: only one partner serves'
          ]
        }
      ]
    },
    serving: {
      title: 'Serving Rules',
      content: [
        {
          heading: 'Underhand Serve',
          text: 'The serve must be hit underhand with the paddle below the waist. The ball must be struck below the waist level, and the paddle head must be below the wrist at contact.'
        },
        {
          heading: 'Drop Serve (New Rule)',
          text: 'Players can now drop the ball and hit it after it bounces. This is often easier for beginners and eliminates many service faults.'
        },
        {
          heading: 'Service Rules',
          points: [
            'Server must keep both feet behind the baseline',
            'Serve must land in the diagonal service court',
            'Serve cannot land in the kitchen or on the kitchen line',
            'Only one serve attempt allowed (except let serves)',
            'Server switches sides after scoring a point',
            'In doubles, server stays on same side during one serving turn'
          ]
        }
      ]
    },
    kitchen: {
      title: 'The Kitchen (Non-Volley Zone)',
      content: [
        {
          heading: 'What is the Kitchen?',
          text: 'The kitchen is a 7-foot zone on both sides of the net. It is also called the "non-volley zone" because you cannot volley (hit the ball before it bounces) while standing in this area.'
        },
        {
          heading: 'Kitchen Rules',
          points: [
            'Cannot volley while standing in the kitchen',
            'Cannot step into the kitchen to volley (even after hitting)',
            'Can enter the kitchen to hit a ball that has bounced',
            'Momentum cannot carry you into the kitchen after a volley',
            'Partner can be in the kitchen while you volley from outside',
            'Kitchen violations result in a fault'
          ]
        },
        {
          heading: 'Kitchen Strategy',
          text: 'The "dink" is a soft shot hit into the opponent\'s kitchen. Players exchange dinks at the net, trying to force an error. Good dinking requires patience, touch, and placement over power.'
        }
      ]
    },
    etiquette: {
      title: 'Pickleball Etiquette',
      content: [
        {
          heading: 'Before the Game',
          points: [
            'Introduce yourself if playing with new people',
            'Ask before using someone else\'s ball',
            'Warm up cooperatively - don\'t smash during warm-up',
            'Check that the court is clear before serving'
          ]
        },
        {
          heading: 'During the Game',
          points: [
            'Call the score clearly before each serve',
            'If ball is coming from another court, call "Ball!"',
            'Don\'t cross behind active courts during play',
            'Call your own lines - be honest and fair',
            'If in doubt, call it in (opponent gets benefit)',
            'Don\'t argue line calls'
          ]
        },
        {
          heading: 'After the Game',
          points: [
            'Tap paddles (or bump fists) at the net',
            'Say "Good game" or "Nice playing"',
            'Thank your partners and opponents',
            'Leave the court promptly if others are waiting',
            'Pick up all balls and equipment'
          ]
        },
        {
          heading: 'General Courtesy',
          text: 'Pickleball is known for being a friendly, social sport. Good sportsmanship and positive attitude are more important than winning. Have fun and help others enjoy the game!'
        }
      ]
    }
  };

  const currentContent = content[activeSection];

  return (
    <div>
      <div className="page-header">
        <h1>Pickleball Rules & Guide</h1>
        <p>Learn the basics, master the rules, and understand the etiquette</p>
      </div>

      <div className="rules-container">
        <div className="rules-sidebar">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <button
                key={section.id}
                className={`rule-tab ${activeSection === section.id ? 'active' : ''}`}
                onClick={() => setActiveSection(section.id)}
              >
                <Icon size={20} />
                <span>{section.label}</span>
              </button>
            );
          })}
        </div>

        <div className="rules-content">
          <div className="rules-card">
            <h2>{currentContent.title}</h2>
            
            {activeSection === 'howtoplay' && <PickleballAnimation />}
            
            {currentContent.content.map((item, index) => (
              <div key={index} className="rule-section">
                <h3>{item.heading}</h3>
                {item.text && <p>{item.text}</p>}
                {item.points && (
                  <ul className="rule-points">
                    {item.points.map((point, pIndex) => (
                      <li key={pIndex}>{point}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Rules;
