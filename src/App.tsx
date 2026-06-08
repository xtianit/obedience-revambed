// 🧠 FIXED PRODUCTION ARCHITECTURE (Halts recursive mobile loops)
    useEffect(() => {
        if (screen !== "app") return;

        let isMounted = true;
        scriptureSeeded.current = false;

        const executeSecureBootstrap = async () => {
            // Guard: Stand down if a thread is already actively running
            if (lessonsLoadingRef.current) return;
            
            try {
                // Fetch lessons and scripture databases concurrently in a parallel layout block
                await Promise.all([
                    loadLessons(),
                    loadScripturesFromDB()
                ]);
            } catch (err) {
                console.error("System bootstrap execution anomaly:", err);
            }
        };

        if (isMounted) {
            void executeSecureBootstrap();
        }

        return () => {
            isMounted = false;
        };
        // ⚡ VERDICT REMEDY: Tracking ONLY [screen] breaks the infinite mobile thread loop completely
    }, [screen]);
