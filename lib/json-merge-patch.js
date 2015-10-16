var JsonMergePatch = function (obj) {
    if (obj instanceof JsonMergePatch) return obj;
    if (!(this instanceof JsonMergePatch)) return new JsonMergePatch(obj);
    this._wrapped = obj;
};

function equal(obj1, obj2) {
    return JSON.stringify(obj1) === JSON.stringify(obj2);
}

function arrayEquals(before, after) {
    if (before.length !== after.length) {
        return false;
    }
    for (var i = 0; i < before.length; i++) {
        if (!equal(after[i], before[i])) {
            return false;
        }
    }
    return true;
}

JsonMergePatch.apply = function apply(target, patch) {
    if (patch === null || typeof patch !== 'object' || Array.isArray(patch)) {
        return patch;
    }
    if (target === null || typeof target !== 'object' || Array.isArray(target)) {
        target = {};
    }
    var keys = Object.keys(patch);
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        if (patch[key] === null) {
            if (target.hasOwnProperty(key)) {
                delete target[key];
            }
        } else {
            target[key] = apply(target[key], patch[key]);
        }
    }
    return target;
};

JsonMergePatch.merge = function merge(patch1, patch2) {
    if (patch1 === null || patch2 === null ||
        typeof patch1 !== 'object' || typeof patch2 !== 'object' ||
        Array.isArray(patch1) !== Array.isArray(patch2)) {
        return patch2;
    }
    var patch = JSON.parse(JSON.stringify(patch1));

    Object.keys(patch2)
        .forEach(function (key) {
            if (patch1[key] !== undefined) {
                patch[key] = merge(patch1[key], patch2[key]);
            } else {
                patch[key] = patch2[key];
            }
        });
    return patch;
};

JsonMergePatch.generatePatch = function generate(before, after) {
    if (before === null || after === null ||
        typeof before !== 'object' || typeof after !== 'object' ||
        Array.isArray(before) !== Array.isArray(after)) {
        return after;
    }

    if (Array.isArray(before)) {
        if (!arrayEquals(before, after)) {
            return after;
        }
        return undefined;
    }

    var patch = {};
    var beforeKeys = Object.keys(before);
    var afterKeys = Object.keys(after);

    var key, i;

    // new elements
    var newKeys = {};
    for (i = 0; i < afterKeys.length; i++) {
        key = afterKeys[i];
        if (beforeKeys.indexOf(key) === -1) {
            newKeys[key] = true;
            patch[key] = after[key];
        }
    }

    // removed & modified elements
    var removedKeys = {};
    for (i = 0; i < beforeKeys.length; i++) {
        key = beforeKeys[i];
        if (afterKeys.indexOf(key) === -1) {
            removedKeys[key] = true;
            patch[key] = null;
        } else {
            if (before[key] !== null && typeof before[key] === 'object') {
                var subPatch = generate(before[key], after[key]);
                if (subPatch !== undefined) {
                    patch[key] = subPatch;
                }
            } else if (before[key] !== after[key]) {
                patch[key] = after[key];
            }
        }
    }

    return (Object.keys(patch).length > 0 ? patch : undefined);
};