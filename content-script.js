let userId;
let currentPostId;
let currentType;

startLocationDetect();
startRootMutationObserver();


function startRootMutationObserver() {
    const targetNode = document.querySelector('#root');
    const observer = new MutationObserver((mutationList, observer) => {
        getUserId();
        if (userId) {
            observer.disconnect();
        }
    });

    observer.observe(targetNode, {
        attributes: false,
        childList: true,
        subtree: true,
    });
}

function getUserId() {
    if (userId) {
        return;
    }

    const profileImageElm = document.querySelector('img[src^="/profile-image/"]');
    console.log(profileImageElm);
    if (!profileImageElm) {
        return;
    }

    // https://hmg.dooray.com/profile-image/3436949257706628688;h=c0dcdcbe6f98826c5079f9ce09fa1dbe?size=36
    const regex = /profile-image\/([0-9]+)/;
    const matches = regex.exec(profileImageElm.getAttribute('src'));
    userId = matches[1];
    console.log(userId);
}

function getCurrentPostId() {
    // https://hmg.dooray.com/task/3207802720193745614/3650804052181618116
    const taskRegex = /\/(task)\/[0-9]+\/([0-9]+)/;
    const matches = taskRegex.exec(document.location.pathname);

    currentType = matches[1];
    currentPostId = matches[2];

    console.log(currentType, currentPostId);
}

function startLocationDetect() {
    let currentLocation;

    function callback() {
        if (currentLocation !== document.location.href) {
            currentLocation = document.location.href;
            onChangeLocation();
        }

        window.requestAnimationFrame(callback);
    }

    window.requestAnimationFrame(callback);
}

async function onChangeLocation() {
    getCurrentPostId();
    await waitContents();

    const isTranslate = document.querySelector('#task-detail-default svg[data-icon="exchange"]');
    if (isTranslate) {
        return;
    }

    await insertPostTranslatorIndexedDB();
    document.location.reload();
}

function insertPostTranslatorIndexedDB() {
    return new Promise(resolve => {
        const typeMap = {
            task: 'project',
        };

        const dbName = `@dooray/${typeMap[currentType]}/${userId}`;
        const request = window.indexedDB.open(dbName);

        request.onsuccess = () => {
            const db = request.result;
            const transaction = db.transaction('postTranslator', 'readwrite');
            const objStore = transaction.objectStore('postTranslator');

            const now = new Date();

            objStore.put({
                id: currentPostId,
                active: true,
                use: true,
                sourceLanguage: 'auto',
                targetLanguage: 'en',
                createdAt: now.toISOString(),
                updatedAt: now.toISOString(),
            })
        }

        resolve();
    });
}

async function waitContents() {
    return new Promise(resolve => {
        function observe() {
            const targetNode = document.querySelector('.common-content-view-viewer');
            if (!targetNode) {
                window.requestAnimationFrame(observe);
                return;
            }

            resolve();
        }

        window.requestAnimationFrame(observe);
    });
}