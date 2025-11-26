import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { colors } from "../../constants/colors";

import { siNestjs, siTypescript, siReact, siMysql, siDocker } from 'simple-icons'

const techStack = [
    { icon: siTypescript, label: "TypeScript", color: colors.purple },
    { icon: siReact, label: "React", color: colors.cyan },
    { icon: siNestjs, label: "Nest.js", color: colors.green },
    { icon: siMysql, label: "SQL", color: colors.green },
    { icon: siDocker, label: "Docker", color: colors.purple },
]

function HomePage() {
    const experiments = [
        {
            id: 1,
            title: "Tic Tac Toe",
            description: "Just testing some game logic & animations",
            gradient: colors.gradient1,
            link: "/tetris",
            icon: "🎮",
            tech: ["React", "TypeScript", "Framer Motion"]
        },
        {
            id: 2,
            title: "More Stuff",
            description: "Who knows what I'll build next...",
            gradient: colors.gradient2,
            link: "#",
            icon: "🤷",
            tech: ["Node.js", "Express", "MongoDB"]
        },
        {
            id: 3,
            title: "Random Ideas",
            description: "Experimenting with random things",
            gradient: colors.gradient3,
            link: "#",
            icon: "🧪",
            tech: ["Python", "FastAPI", "PostgreSQL"]
        }
    ];

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.2
            }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: {
                type: "spring" as const,
                stiffness: 100
            }
        }
    };

    return (
        <main
            style={{ backgroundColor: colors.bgPrimary }}
            className=" flex flex-col items-center justify-center px-4 py-20"
        >
            {/* Decorative code pattern background */}
            <div className="fixed inset-0 opacity-5 pointer-events-none font-mono text-sm">
                <div className="absolute" style={{ top: '10%', left: '5%' }}>{'<Code />'}</div>
                <div className="absolute" style={{ top: '15%', right: '10%' }}>{'{ }'}</div>
                <div className="absolute" style={{ bottom: '25%', left: '15%' }}>{'=> { }'}</div>
                <div className="absolute" style={{ bottom: '20%', right: '8%' }}>{'</>'}</div>
                <div className="absolute" style={{ top: '40%', left: '8%' }}>{'API'}</div>
                <div className="absolute" style={{ top: '60%', right: '12%' }}>{'async'}</div>
            </div>

            {/* Hero Section */}
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="text-center mb-16 relative z-10"
            >

                <h1
                    style={{ color: colors.textPrimary }}
                    className="text-5xl md:text-7xl font-bold mb-4"
                >
                    Messing Around
                    <span
                        style={{
                            background: colors.gradientTech,
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text'
                        }}
                        className="block mt-2"
                    >
                        Web Playground
                    </span>
                </h1>

                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="mt-6"
                >
                    <p
                        style={{ color: colors.textSecondary }}
                        className="text-xl md:text-2xl"
                    >
                        Just a place to test stuff & experiment with code
                    </p>
                </motion.div>
            </motion.div>

            {/* Experiments Grid */}
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl w-full relative z-10"
            >
                {experiments.map((experiment) => (
                    <motion.div
                        key={experiment.id}
                        variants={itemVariants}
                        whileHover={{ scale: 1.05, y: -10 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <Link to={experiment.link}>
                            <div
                                style={{
                                    backgroundColor: colors.cardBg,
                                    borderColor: colors.border,
                                    boxShadow: `0 4px 20px rgba(0, 0, 0, 0.3)`
                                }}
                                className="rounded-2xl p-8 border border-opacity-50 hover:border-opacity-100 transition-all duration-300 h-full flex flex-col space-y-4 relative overflow-hidden group"
                            >
                                {/* Gradient Overlay on Hover */}
                                <div
                                    style={{ background: experiment.gradient }}
                                    className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300"
                                />

                                {/* Icon with animation */}
                                <motion.div
                                    className="text-6xl mb-2 relative z-10"
                                    whileHover={{
                                        scale: 1.2,
                                        rotate: [0, -5, 5, -5, 0]
                                    }}
                                    transition={{ duration: 0.5 }}
                                >
                                    {experiment.icon}
                                </motion.div>

                                {/* Title */}
                                <h2
                                    style={{ color: colors.textPrimary }}
                                    className="text-2xl font-bold relative z-10"
                                >
                                    {experiment.title}
                                </h2>

                                {/* Description */}
                                <p
                                    style={{ color: colors.textSecondary }}
                                    className="text-base relative z-10 grow"
                                >
                                    {experiment.description}
                                </p>

                                {/* Tech Stack */}
                                <div className="flex flex-wrap gap-2 relative z-10">
                                    {experiment.tech.map((tech, index) => (
                                        <span
                                            key={index}
                                            style={{
                                                backgroundColor: colors.bgAccent,
                                                color: colors.cyan
                                            }}
                                            className="px-3 py-1 rounded-full text-xs font-semibold"
                                        >
                                            {tech}
                                        </span>
                                    ))}
                                </div>

                                {/* Action Button */}
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    style={{
                                        background: experiment.link === "#"
                                            ? colors.border
                                            : experiment.gradient,
                                        color: colors.textPrimary,
                                        boxShadow: experiment.link === "#"
                                            ? 'none'
                                            : `0 4px 15px rgba(102, 126, 234, 0.4)`
                                    }}
                                    className="mt-4 px-6 py-3 rounded-lg font-semibold text-sm relative z-10 w-full"
                                    disabled={experiment.link === "#"}
                                >
                                    {experiment.link === "#" ? "Maybe Later 🤔" : "Check it out →"}
                                </motion.button>
                            </div>
                        </Link>
                    </motion.div>
                ))}
            </motion.div>

            {/* Tech Stack Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="mt-16 grid grid-cols-2 md:grid-cols-5 gap-6 max-w-4xl w-full relative z-10"
            >
                {techStack.map((tech, index) => (
                    <motion.div
                        key={index}
                        whileHover={{ scale: 1.05, y: -5 }}
                        style={{
                            backgroundColor: colors.cardBg,
                            borderColor: colors.border
                        }}
                        className="rounded-xl p-6 border text-center"
                    >
                        <div className="text-4xl mb-2">
                            <img src={tech.icon.svg} alt={tech.label} className="w-10 h-10" />
                        </div>
                        <div
                            style={{ color: tech.color }}
                            className="text-lg font-semibold"
                        >
                            {tech.label}
                        </div>
                    </motion.div>
                ))}
            </motion.div>

            {/* Footer Section */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="mt-16 text-center relative z-10"
            >
                <p
                    style={{ color: colors.textSecondary }}
                    className="text-base"
                >
                    Made with
                    <span
                        style={{ color: colors.cyan }}
                        className="font-bold mx-2"
                    >
                        coffee ☕
                    </span>
                    and
                    <span
                        style={{ color: colors.purple }}
                        className="font-bold mx-2"
                    >
                        curiosity
                    </span>
                </p>
                <p
                    style={{ color: colors.textSecondary }}
                    className="text-sm mt-2"
                >
                    Just Valentino testing stuff 🤓
                </p>
            </motion.div>


        </main>
    );
}

export default HomePage;
