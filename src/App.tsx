  useEffect(() => {
            if (screen !== "app") return;

            let isMounted = true;

            // Reset initial states safely
            scriptureSeeded.current = false;

            const initializeAppData = async () => {
                // Prevent concurrent triggers if already fetching
                if (lessonsLoadingRef.current) return;
                
                lessonsLoadingRef.current = true;
                setLessonsLoading(true);

                try {
                    // Load both datasets concurrently to improve mobile load speed
                    await Promise.all([
                        loadLessons(),
                        loadScripturesFromDB()
                    ]);
                } catch (error) {
                    console.error("Failed to load app data on refresh:", error);
                } finally {
                    // Only toggle states if the user hasn't refreshed/unmounted again mid-request
                    if (isMounted) {
                        lessonsLoadingRef.current = false;
                        setLessonsLoading(false);
                    }
                }
            };

            void initializeAppData();

            // ── Realtime: push new active lesson to ALL connected devices ──────────
            const channel = supabase
                .channel("lessons-realtime")
                .on(
                    "postgres_changes",
                    { event: "UPDATE", schema: "public", table: "lessons" },
                    (payload) => {
                        if (payload.new?.is_active === true) {
                            const newLesson = payload.new as LessonRow;
                            setActiveLesson(newLesson.id);
                            setContentData(hydrateLessonData(newLesson.content));
                            setLessons(prev => prev.map(l => ({ ...l, is_active: l.id === newLesson.id })) );
                        }
                    }
                )
                .subscribe();

            // Cleanup hook returns
            return () => {
                isMounted = false;
                void supabase.removeChannel(channel);
            };
        }, [screen, loadLessons, loadScripturesFromDB, setActiveLesson]); // Make sure dependencies match your hook context
