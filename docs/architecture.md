# Open Learn Architecture

## System Overview

```mermaid
graph TB
    subgraph "Browser"
        subgraph "Vue App"
            App[App.vue<br/>Navigation + Header + Footer]

            subgraph "Views"
                Home[Home.vue<br/>Language Selection]
                WO[WorkshopOverview.vue<br/>Workshop Grid + Filters]
                LO[LessonsOverview.vue<br/>Lesson Cards + Progress]
                LD[LessonDetail.vue<br/>Content + Audio + Assessments]
                SV[StoryView.vue<br/>Immersive Story Mode]
                LI[LearningItems.vue<br/>Vocabulary Browser]
                AR[AssessmentResults.vue<br/>Results Overview]
                Coach[Coach.vue<br/>AI Chat]
                Settings[Settings.vue<br/>Preferences]
                Profile[Profile.vue<br/>User Account]
                AddSource[AddSource.vue<br/>Import Workshop]
            end

            subgraph "Composables (Singleton State)"
                UL[useLessons<br/>Content Loading]
                UA[useAudio<br/>Audio Playback]
                UP[useProgress<br/>Learning Progress]
                UAs[useAssessments<br/>Answer Tracking]
                US[useSettings<br/>Preferences]
                UG[useGun<br/>P2P Sync]
                UO[useOffline<br/>Offline Caching]
                ULang[useLanguage<br/>i18n + RTL]
                UC[useCoach<br/>Coach API]
                UM[useManifest<br/>PWA Manifest]
            end

            subgraph "Shared Components"
                LC[LessonCard]
                LP[LearningPath]
                PB[ProgressBar]
                SS[StoryScene<br/>SVG Renderer]
                UI[shadcn/ui<br/>Button Card Badge ...]
            end
        end

        subgraph "Storage"
            LS[(localStorage)]
            SW[Service Worker<br/>+ Cache API]
        end
    end

    subgraph "External"
        GH[GitHub Pages<br/>Static Hosting]
        Gun[GunDB<br/>P2P Sync]
        CoachAPI[Coach API<br/>External Service]
        CDN[CDN<br/>Vue + Libs]
    end

    subgraph "Workshop Repos"
        WR1[workshop-portugiesisch]
        WR2[workshop-english]
        WR3[workshop-milas-abenteuer]
        WRn[workshop-...]
    end
```

## View → Composable Dependencies

```mermaid
graph LR
    subgraph "Views"
        Home
        WO[WorkshopOverview]
        LO[LessonsOverview]
        LD[LessonDetail]
        SV[StoryView]
        LI[LearningItems]
        AR[AssessmentResults]
        Coach
        Settings
        Profile
    end

    subgraph "Composables"
        UL[useLessons]
        UA[useAudio]
        UP[useProgress]
        UAs[useAssessments]
        US[useSettings]
        UG[useGun]
        UO[useOffline]
        ULang[useLanguage]
        UC[useCoach]
    end

    Home --> UL
    Home --> ULang
    WO --> UL
    WO --> ULang
    WO --> UO
    WO --> UP
    LO --> UL
    LO --> UP
    LO --> UO
    LD --> UL
    LD --> UA
    LD --> UP
    LD --> UAs
    LD --> US
    SV --> UL
    SV --> UA
    SV --> UP
    SV --> US
    SV --> UAs
    LI --> UL
    LI --> UP
    AR --> UL
    AR --> UAs
    AR --> UP
    Coach --> UL
    Coach --> UC
    Settings --> US
    Settings --> UG
    Profile --> UG
    Profile --> UP
    Profile --> UAs
```

## Data Loading Flow

```mermaid
sequenceDiagram
    participant U as User
    participant App as App.vue
    participant V as View
    participant UL as useLessons
    participant GH as GitHub Pages

    U->>App: Open /#/deutsch/portugiesisch/lesson/1
    App->>UL: loadAvailableContent()
    UL->>GH: fetch languages.yaml
    GH-->>UL: 15 languages

    Note over App: App sets language, views load their own data

    V->>UL: loadWorkshopsForLanguage('deutsch', 'portugiesisch')
    UL->>UL: loadSourcesForLanguage('deutsch', 'portugiesisch')
    UL->>GH: fetch workshop-portugiesisch/index.yaml
    GH-->>UL: languages + workshop metadata
    UL->>GH: fetch deutsch/workshops.yaml
    GH-->>UL: 1 workshop loaded

    V->>UL: loadAllLessonsForWorkshop('deutsch', 'portugiesisch')
    UL->>GH: fetch lessons.yaml
    GH-->>UL: 10 lesson folders
    UL->>GH: fetch content.yaml ×10 (parallel)
    GH-->>UL: 10 lessons loaded

    V->>V: Render lesson content
```

## Audio Playback Flow

```mermaid
stateDiagram-v2
    [*] --> Idle
    Idle --> Loading: initializeAudio()
    Loading --> Ready: Pre-loaded N files
    Ready --> Playing: play()
    Playing --> Paused: pause()
    Paused --> Playing: resume()
    Playing --> Playing: playNextItem()
    Playing --> RetryPlay: play() failed
    RetryPlay --> Playing: Fresh audio element
    RetryPlay --> Stopped: Retry failed
    Playing --> Stopped: End of queue
    Stopped --> [*]

    note right of Loading
        Parallel pre-load all MP3 files
        From manifest.yaml or all queue items
    end note

    note right of RetryPlay
        iOS drops preloaded audio
        Create fresh Audio element
    end note
```

## Workshop Content Structure

```mermaid
graph TD
    subgraph "Workshop Repo"
        IX[index.yaml<br/>Languages]

        subgraph "deutsch/"
            WS[workshops.yaml<br/>Title, Labels, Colors]
            subgraph "workshop-folder/"
                LS[lessons.yaml<br/>Lesson List]
                subgraph "01-lesson/"
                    CY[content.yaml<br/>Sections + Examples]
                    subgraph "audio/"
                        T[title.mp3]
                        ST[0-title.mp3]
                        Q[0-0-q.mp3]
                        A[0-0-a.mp3]
                    end
                    subgraph "images/"
                        IMG[section.svg]
                    end
                end
            end
        end
    end

    subgraph "Landing Page"
        IH[index.html<br/>11 lines]
        OL[open-learn.js<br/>Vue Components via CDN]
        RM[README.md]
        CL[CHANGELOG.md]
    end

    IH --> OL
    OL --> IX
    OL --> WS
    OL --> LS
    OL --> CY
    OL --> CL
```

## State Persistence

```mermaid
graph TD
    subgraph "Composable State"
        S1[useSettings<br/>darkMode, audioSpeed, ...]
        S2[useProgress<br/>learned items, lesson status]
        S3[useAssessments<br/>answers, sent history]
        S4[useLessons<br/>loaded content cache]
    end

    subgraph "localStorage"
        LS1[settings]
        LS2[progress + lessonProgress]
        LS3[assessments + sentHistory]
        LS4[contentSources]
    end

    subgraph "GunDB (P2P)"
        G1[encrypted settings]
        G2[encrypted progress]
        G3[encrypted assessments]
    end

    S1 --> LS1
    S2 --> LS2
    S3 --> LS3
    S4 --> LS4

    S1 -.->|sync| G1
    S2 -.->|sync| G2
    S3 -.->|sync| G3

    subgraph "Cache API (Service Worker)"
        C1[workshop-metadata]
        C2[workshop-content]
        C3[app shell]
    end
```

## Navigation (Mobile)

```mermaid
graph LR
    subgraph "Header"
        direction LR
        LANG[🇩🇪 Language<br/>Dropdown]
        BACK[← Back]
        TITLE[Title]
        STORY[📖 Story]
        TOGGLE[🔄 Toggle<br/>Items↔Results↔Lesson]
        BURGER[☰ Menu]
    end

    subgraph "Toggle Cycle"
        L[Lesson Detail] -->|tap| I[Items 📇]
        I -->|tap| R[Results 📋]
        R -->|tap| L
    end

    subgraph "Floating"
        FAB[▶ Play/Pause<br/>bottom-right]
    end

    subgraph "Burger Menu"
        SET[⚙ Settings]
        PROF[👤 Profile]
        WS[▦ Workshops]
        VER[v1.1.0 · #203]
    end
```
