import React, { useState } from 'react';
import {
  FaFilm, FaBrain, FaGamepad, FaTrophy, FaChartLine,
  FaSmile, FaStar, FaGooglePlay, FaBars, FaTimes,
  FaQuoteLeft, FaArrowRight, FaCheck,
} from 'react-icons/fa';
import {
  MdMovie, MdTheaters, MdLeaderboard, MdQuiz,
} from 'react-icons/md';

const PLAY_STORE_LINK =
  'https://play.google.com/store/apps/details?id=com.bytebodh.javify&pcampaignid=web_share';

// Real Unsplash movie images
const MOVIE_IMAGES = [
  {
    url: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&q=80',
    alt: 'Cinema hall',
  },
  {
    url: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=600&q=80',
    alt: 'Movie night',
  },
  {
    url: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=600&q=80',
    alt: 'Film making',
  },
];

const FEATURE_IMAGES = [
  'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&q=80',
  'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=400&q=80',
  'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&q=80',
  'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=400&q=80',
  'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=400&q=80',
  'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=400&q=80',
];

const Website = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const features = [
    {
      icon: <MdTheaters className="text-3xl" />,
      title: 'Multi-Industry Quizzes',
      desc: 'Play quizzes from Tollywood, Bollywood, Hollywood, Kollywood, Mollywood, Sandalwood, and more.',
    },
    {
      icon: <FaBrain className="text-3xl" />,
      title: 'Thousands of Questions',
      desc: 'Answer questions about movies, actors, directors, dialogues, songs, and famous scenes.',
    },
    {
      icon: <FaGamepad className="text-3xl" />,
      title: 'Multiple Quiz Modes',
      desc: 'Guess the Movie, Actor Trivia, Dialogue Challenge, Movie Poster Quiz and more.',
    },
    {
      icon: <FaTrophy className="text-3xl" />,
      title: 'Leaderboards & Achievements',
      desc: 'Compete with other movie fans and climb the leaderboard to become the ultimate champion.',
    },
    {
      icon: <FaChartLine className="text-3xl" />,
      title: 'Track Your Progress',
      desc: 'See your quiz performance, scores, and achievements as you improve your movie knowledge.',
    },
    {
      icon: <FaSmile className="text-3xl" />,
      title: 'Fun for Everyone',
      desc: 'From beginners to film experts, everyone can enjoy the exciting challenges in MovieMind.',
    },
  ];

  const quizModes = [
    { icon: <MdMovie className="text-4xl" />, title: 'Guess the Movie' },
    { icon: <FaStar className="text-4xl" />, title: 'Actor & Actress Trivia' },
    { icon: <FaQuoteLeft className="text-4xl" />, title: 'Dialogue Challenge' },
    { icon: <MdQuiz className="text-4xl" />, title: 'Movie Poster Quiz' },
  ];

  const whyChoose = [
    'Covers all major film industries',
    'Regular updates with new questions',
    'Simple and user-friendly interface',
    'Perfect for movie buffs and quiz lovers',
  ];

  const scrollTo = (id) => {
    setMobileMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };


  return (
    <div className="min-h-screen bg-white text-gray-800 font-sans antialiased">

      {/* ── Navbar ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <button onClick={() => scrollTo('hero')} className="flex items-center gap-2 text-red-600 font-bold text-xl tracking-tight">
            <FaFilm className="text-2xl" /> MovieMind
          </button>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
            {['features', 'quiz-modes', 'leaderboard', 'why-us'].map((id) => (
              <button key={id} onClick={() => scrollTo(id)} className="hover:text-red-600 transition capitalize">
                {id.replace('-', ' ')}
              </button>
            ))}
            <a
              href={PLAY_STORE_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-2 inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-full text-sm font-semibold transition shadow-md shadow-red-200"
            >
              <FaGooglePlay /> Download
            </a>
          </div>

          <button className="md:hidden text-gray-700 text-2xl" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <FaTimes /> : <FaBars />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t px-6 pb-4 space-y-3 text-sm font-medium text-gray-600">
            {['features', 'quiz-modes', 'leaderboard', 'why-us'].map((id) => (
              <button key={id} onClick={() => scrollTo(id)} className="block w-full text-left py-2 hover:text-red-600 capitalize">
                {id.replace('-', ' ')}
              </button>
            ))}
            <a
              href={PLAY_STORE_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-red-600 text-white px-5 py-2 rounded-full text-sm font-semibold mt-2"
            >
              <FaGooglePlay /> Download Now
            </a>
          </div>
        )}
      </nav>

      {/* ── Hero ── */}
      <section
        id="hero"
        className="relative pt-32 pb-20 md:pt-44 md:pb-32 overflow-hidden text-white"
        style={{
          background: 'linear-gradient(135deg, #7f0000 0%, #b91c1c 40%, #991b1b 100%)',
        }}
      >
        {/* Real background image overlay */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: `url('https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1920&q=80')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-red-900/80 via-red-800/60 to-red-900/90" />

        {/* decorative circles */}
        <div className="absolute -top-20 -left-20 w-96 h-96 bg-red-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-red-400/20 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: text */}
            <div className="text-center lg:text-left">
              <span className="inline-block bg-white/10 backdrop-blur text-sm font-medium px-4 py-1.5 rounded-full mb-6">
                🎬 The Ultimate Movie Quiz App
              </span>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight tracking-tight">
                How Well Do You<br />
                <span className="text-red-200">Know Movies?</span>
              </h1>
              <p className="mt-6 text-lg text-red-100 max-w-xl leading-relaxed">
                Test your knowledge across Tollywood, Bollywood, Hollywood, Kollywood &amp; more.
                Thousands of questions, multiple quiz modes, and endless fun await!
              </p>

              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <a
                  href={PLAY_STORE_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-3 bg-white text-red-700 hover:bg-red-50 px-8 py-4 rounded-full text-lg font-bold transition shadow-xl shadow-red-900/30"
                >
                  <FaGooglePlay className="text-xl" /> Download on Play Store
                </a>
                <button
                  onClick={() => scrollTo('features')}
                  className="inline-flex items-center gap-2 text-white/90 hover:text-white border border-white/30 hover:border-white/60 px-6 py-3.5 rounded-full text-base font-medium transition"
                >
                  Explore Features <FaArrowRight />
                </button>
              </div>

              {/* stats */}
              <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  ['5+', 'Film Industries'],
                  ['1000+', 'Quiz Questions'],
                  ['4', 'Quiz Modes'],
                  ['4.5★', 'User Rating'],
                ].map(([num, label]) => (
                  <div key={label} className="bg-white/10 backdrop-blur rounded-2xl py-4 px-3 text-center">
                    <div className="text-2xl font-bold">{num}</div>
                    <div className="text-xs text-red-200 mt-1">{label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: movie image grid */}
            <div className="hidden lg:grid grid-cols-2 gap-3">
              {MOVIE_IMAGES.map((img, i) => (
                <div
                  key={i}
                  className={`overflow-hidden rounded-2xl shadow-2xl ${i === 0 ? 'col-span-2 h-48' : 'h-36'}`}
                >
                  <img
                    src={img.url}
                    alt={img.alt}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-20 md:py-28 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-red-600 font-semibold text-sm uppercase tracking-wider">Features</span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold text-gray-900">
              Everything a Movie Buff Needs
            </h2>
            <p className="mt-4 text-gray-500 text-lg">
              MovieMind is packed with features designed to challenge, entertain, and educate every movie fan.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((f, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-lg hover:border-red-100 transition group"
              >
                <div className="h-36 overflow-hidden">
                  <img
                    src={FEATURE_IMAGES[i]}
                    alt={f.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-6">
                  <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center mb-4 group-hover:bg-red-600 group-hover:text-white transition -mt-10 relative z-10 shadow-md border-2 border-white">
                    {f.icon}
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">{f.title}</h3>
                  <p className="mt-2 text-gray-500 text-sm leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Quiz Modes ── */}
      <section id="quiz-modes" className="py-20 md:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-red-600 font-semibold text-sm uppercase tracking-wider">Quiz Modes</span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold text-gray-900">
              Multiple Ways to Play
            </h2>
            <p className="mt-4 text-gray-500 text-lg">
              Choose your favourite quiz mode and put your movie knowledge to the test.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {quizModes.map((m, i) => (
              <div
                key={i}
                className="relative bg-gradient-to-br from-red-600 to-red-700 text-white rounded-2xl p-8 text-center overflow-hidden group hover:scale-[1.03] transition-transform"
              >
                <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
                <div className="relative">
                  <div className="mx-auto w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mb-4">
                    {m.icon}
                  </div>
                  <h3 className="text-lg font-bold">{m.title}</h3>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why Choose MovieMind ── */}
      <section id="why-us" className="py-20 md:py-28 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* left: image + card */}
            <div className="relative">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                <img
                  src="https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=800&q=80"
                  alt="Film reel"
                  className="w-full h-80 object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-red-900/90 via-red-800/40 to-transparent flex flex-col justify-end p-8">
                  <FaFilm className="text-5xl mb-4 text-red-300" />
                  <h3 className="text-2xl font-extrabold text-white leading-tight">
                    The #1 Movie Quiz App for Every Film Lover
                  </h3>
                  <a
                    href={PLAY_STORE_LINK}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 mt-5 bg-white text-red-700 hover:bg-red-50 px-6 py-3 rounded-full font-semibold transition shadow-lg w-fit"
                  >
                    <FaGooglePlay /> Get It Free
                  </a>
                </div>
              </div>
              <div className="absolute -z-10 -bottom-4 -right-4 w-full h-full bg-red-200 rounded-3xl" />
            </div>

            {/* right list */}
            <div>
              <span className="text-red-600 font-semibold text-sm uppercase tracking-wider">Why Choose Us</span>
              <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold text-gray-900">
                Built for True Movie Fans
              </h2>
              <p className="mt-4 text-gray-500 text-lg">
                MovieMind stands out as the go-to app for anyone who loves cinema across every film industry.
              </p>
              <ul className="mt-8 space-y-4">
                {whyChoose.map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="mt-1 flex-shrink-0 w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs">
                      <FaCheck />
                    </span>
                    <span className="text-gray-700 text-base">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="relative py-20 md:py-28 text-white text-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url('https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1920&q=80')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-red-900/95 via-red-800/90 to-red-900/95" />
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-40 h-40 border-2 border-white rounded-full" />
          <div className="absolute bottom-10 right-10 w-60 h-60 border-2 border-white rounded-full" />
        </div>
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6">
          <MdLeaderboard className="text-6xl mx-auto mb-6 text-red-300" />
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold leading-tight">
            Ready to Prove Your<br />Movie Knowledge?
          </h2>
          <p className="mt-6 text-red-200 text-lg max-w-xl mx-auto">
            Download MovieMind now and challenge yourself with quizzes from every film industry. Compete, learn, and have fun!
          </p>
          <a
            href={PLAY_STORE_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 mt-10 bg-white text-red-700 hover:bg-red-50 px-8 py-4 rounded-full text-lg font-bold transition shadow-xl shadow-red-900/30"
          >
            <FaGooglePlay className="text-xl" /> Download Free on Play Store
          </a>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2 text-white font-bold text-lg">
              <FaFilm className="text-red-500" /> MovieMind
            </div>
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
              {['features', 'quiz-modes', 'leaderboard', 'why-us'].map((id) => (
                <button key={id} onClick={() => scrollTo(id)} className="hover:text-white transition capitalize">
                  {id.replace('-', ' ')}
                </button>
              ))}
              <a
                href={PLAY_STORE_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition"
              >
                Play Store
              </a>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-sm text-gray-500">
            &copy; {new Date().getFullYear()} MovieMind by ByteBodh. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Website;
