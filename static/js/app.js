var App, app;

app = null;

window.addEventListener("load", function() {
  return app = new App();
});

App = (function() {
  function App() {
    this.translator = new Translator(this);
    this.app_state = new AppState(this);
    this.appui = new AppUI(this);
    this.explore = new Explore(this);
    this.client = new Client(this);
    this.about = new About(this);
    this.documentation = new Documentation(this);
    this.editor = new Editor(this);
    this.doc_editor = new DocEditor(this);
    this.sprite_editor = new SpriteEditor(this);
    this.map_editor = new MapEditor(this);
    this.assets_manager = new AssetsManager(this);
    this.audio_controller = new AudioController(this);
    this.sound_editor = new SoundEditor(this);
    this.music_editor = new MusicEditor(this);
    this.runwindow = new RunWindow(this);
    this.options = new Options(this);
    this.publish = new Publish(this);
    this.user_settings = new UserSettings(this);
    this.connected = false;
    this.tutorial = new TutorialWindow(this);
    this.tutorials = new Tutorials(this);
    this.client.start();
  }

  App.prototype.setToken = function(token, username) {
    this.token = token;
    this.username = username;
    return this.client.setToken(this.token);
  };

  App.prototype.createGuest = function() {
    return this.client.sendRequest({
      name: "create_guest",
      language: window.navigator.language != null ? window.navigator.language.substring(0, 2) : "en"
    }, (function(_this) {
      return function(msg) {
        switch (msg.name) {
          case "error":
            console.error(msg.error);
            if (msg.error != null) {
              return alert(_this.translator.get(msg.error));
            }
            break;
          case "guest_created":
            _this.setToken(msg.token);
            _this.nick = msg.nick;
            _this.user = {
              nick: msg.nick,
              flags: msg.flags,
              settings: msg.settings,
              info: msg.info
            };
            _this.connected = true;
            return _this.userConnected(msg.nick);
        }
      };
    })(this));
  };

  App.prototype.createAccount = function(nick, email, password, newsletter) {
    return this.client.sendRequest({
      name: "create_account",
      nick: nick,
      email: email,
      password: password,
      newsletter: newsletter,
      language: window.navigator.language != null ? window.navigator.language.substring(0, 2) : "en"
    }, (function(_this) {
      return function(msg) {
        switch (msg.name) {
          case "error":
            console.error(msg.error);
            if (msg.error != null) {
              return alert(_this.translator.get(msg.error));
            }
            break;
          case "account_created":
            _this.setToken(msg.token);
            _this.nick = nick;
            _this.user = {
              nick: msg.nick,
              email: msg.email,
              flags: msg.flags,
              settings: msg.settings,
              info: msg.info
            };
            _this.connected = true;
            return _this.userConnected(nick);
        }
      };
    })(this));
  };

  App.prototype.login = function(nick, password) {
    return this.client.sendRequest({
      name: "login",
      nick: nick,
      password: password
    }, (function(_this) {
      return function(msg) {
        var j, len, n, ref;
        switch (msg.name) {
          case "error":
            console.error(msg.error);
            if (msg.error != null) {
              return alert(_this.translator.get(msg.error));
            }
            break;
          case "logged_in":
            _this.setToken(msg.token);
            _this.nick = msg.nick;
            _this.user = {
              nick: msg.nick,
              email: msg.email,
              flags: msg.flags,
              settings: msg.settings,
              info: msg.info
            };
            if ((msg.notifications != null) && msg.notifications.length > 0) {
              ref = msg.notifications;
              for (j = 0, len = ref.length; j < len; j++) {
                n = ref[j];
                _this.appui.showNotification(n);
              }
            }
            _this.connected = true;
            _this.userConnected(msg.nick);
            return _this.appui.showNotification(_this.translator.get("Welcome back!"));
        }
      };
    })(this));
  };

  App.prototype.sendPasswordRecovery = function(email) {
    if (!RegexLib.email.test(email)) {
      return alert(this.translator.get("incorrect email"));
    } else {
      return this.client.sendRequest({
        name: "send_password_recovery",
        email: email
      }, (function(_this) {
        return function(msg) {
          document.getElementById("forgot-password-panel").innerHTML = _this.translator.get("Thank you. Please check your mail.");
          return setTimeout((function() {
            return _this.appui.hide("login-overlay");
          }), 5000);
        };
      })(this));
    }
  };

  App.prototype.createProject = function(title, slug, callback) {
    return this.client.sendRequest({
      name: "create_project",
      title: title,
      slug: slug
    }, (function(_this) {
      return function(msg) {
        switch (msg.name) {
          case "error":
            console.error(msg.error);
            if (msg.error != null) {
              alert(_this.translator.get(msg.error));
            }
            break;
          case "project_created":
            _this.getProjectList(function(list) {
              var j, len, p, results;
              _this.projects = list;
              _this.appui.updateProjects();
              results = [];
              for (j = 0, len = list.length; j < len; j++) {
                p = list[j];
                if (p.id === msg.id) {
                  _this.openProject(p);
                  if (callback != null) {
                    results.push(callback());
                  } else {
                    results.push(void 0);
                  }
                } else {
                  results.push(void 0);
                }
              }
              return results;
            });
        }
      };
    })(this));
  };

  App.prototype.importProject = function(files) {
    var err, funk, i, j, len, list;
    try {
      list = [];
      for (j = 0, len = files.length; j < len; j++) {
        i = files[j];
        list.push(i.getAsFile());
      }
      funk = (function(_this) {
        return function() {
          var file, reader;
          if (list.length > 0) {
            file = list.splice(0, 1)[0];
            console.info("processing " + file.name);
            reader = new FileReader();
            reader.addEventListener("load", function() {
              if (!reader.result.startsWith("data:application/x-zip-compressed;base64,")) {
                return;
              }
              return _this.client.sendRequest({
                name: "import_project",
                user: _this.nick,
                zip_data: reader.result
              }, function(msg) {
                console.log("[ZIP] " + msg.name);
                switch (msg.name) {
                  case "error":
                    console.error(msg.error);
                    if (msg.error != null) {
                      return alert(_this.translator.get(msg.error));
                    }
                    break;
                  case "project_imported":
                    return _this.getProjectList(function(list) {
                      _this.projects = list;
                      return _this.appui.updateProjects();
                    });
                }
              });
            });
            return reader.readAsDataURL(file);
          }
        };
      })(this);
      return funk();
    } catch (error) {
      err = error;
      return console.error(err);
    }
  };

  App.prototype.updateProjectList = function(open_when_fetched) {
    return this.getProjectList((function(_this) {
      return function(list) {
        var j, len, p, ref, results;
        _this.projects = list;
        _this.appui.updateProjects();
        if (open_when_fetched != null) {
          ref = _this.projects;
          results = [];
          for (j = 0, len = ref.length; j < len; j++) {
            p = ref[j];
            if (p.id === open_when_fetched) {
              _this.openProject(p);
              break;
            } else {
              results.push(void 0);
            }
          }
          return results;
        }
      };
    })(this));
  };

  App.prototype.getProjectList = function(callback) {
    return this.client.sendRequest({
      name: "get_project_list"
    }, (function(_this) {
      return function(msg) {
        if (callback != null) {
          return callback(msg.list);
        }
      };
    })(this));
  };

  App.prototype.openProject = function(project, useraction) {
    var t, tuto;
    if (useraction == null) {
      useraction = true;
    }
    this.project = new Project(this, project);
    this.appui.setProject(this.project, useraction);
    this.editor.setCode("");
    this.editor.projectOpened();
    this.sprite_editor.projectOpened();
    this.map_editor.projectOpened();
    this.sound_editor.projectOpened();
    this.music_editor.projectOpened();
    if (project.graphics === "M3D") {
      this.assets_manager.projectOpened();
    }
    this.runwindow.projectOpened();
    this.options.projectOpened();
    this.publish.loadProject(this.project);
    this.project.load();
    if (!this.tutorial.shown) {
      tuto = this.getProjectTutorial(project.slug);
      if (tuto != null) {
        t = new Tutorial(tuto);
        return t.load((function(_this) {
          return function() {
            return _this.tutorial.start(t);
          };
        })(this));
      }
    }
  };

  App.prototype.deleteProject = function(project) {
    if (project.owner.nick === this.nick) {
      return this.client.sendRequest({
        name: "delete_project",
        project: project.id
      }, (function(_this) {
        return function(msg) {
          return _this.updateProjectList();
        };
      })(this));
    } else {
      return this.client.sendRequest({
        name: "remove_project_user",
        project: project.id,
        user: this.nick
      });
    }
  };

  App.prototype.projectTitleExists = function(title) {
    var j, len, p, ref;
    if (!this.projects) {
      return false;
    }
    ref = this.projects;
    for (j = 0, len = ref.length; j < len; j++) {
      p = ref[j];
      if (p.title === title) {
        return true;
      }
    }
    return false;
  };

  App.prototype.cloneProject = function(project) {
    var count, title;
    title = project.title + (" (" + (this.translator.get("copy")) + ")");
    count = 1;
    while (this.projectTitleExists(title)) {
      count += 1;
      title = project.title + (" (" + (this.translator.get("copy")) + " " + count + ")");
    }
    return this.client.sendRequest({
      name: "clone_project",
      project: project.id,
      title: title
    }, (function(_this) {
      return function(msg) {
        _this.appui.setMainSection("projects");
        _this.appui.backToProjectList();
        _this.updateProjectList();
        return _this.appui.showNotification(_this.translator.get("Project cloned! Here is your copy."));
      };
    })(this));
  };

  App.prototype.writeProjectFile = function(project_id, file, content, callback) {
    return this.client.sendRequest({
      name: "write_project_file",
      project: project_id,
      file: file,
      content: content
    }, (function(_this) {
      return function(msg) {};
    })(this));
  };

  App.prototype.readProjectFile = function(project_id, file, callback) {
    return this.client.sendRequest({
      name: "read_project_file",
      project: project_id,
      file: file
    }, (function(_this) {
      return function(msg) {
        return callback(msg.content);
      };
    })(this));
  };

  App.prototype.userConnected = function(nick) {
    this.appui.userConnected(nick);
    this.updateProjectList();
    return this.user_settings.update();
  };

  App.prototype.disconnect = function() {
    if ((this.user.email == null) || this.user.flags.guest) {
      return this.client.sendRequest({
        name: "delete_guest"
      }, (function(_this) {
        return function(msg) {
          _this.setToken(null);
          return location.reload();
        };
      })(this));
    } else {
      this.setToken(null);
      return location.reload();
    }
  };

  App.prototype.fetchPublicProjects = function() {
    return this.client.sendRequest({
      name: "get_public_projects",
      ranking: "hot",
      tags: []
    }, (function(_this) {
      return function(msg) {};
    })(this));
  };

  App.prototype.serverMessage = function(msg) {
    switch (msg.name) {
      case "project_user_list":
        return this.updateProjectUserList(msg);
      case "project_list":
        this.projects = msg.list;
        return this.appui.updateProjects();
      case "project_file_locked":
        if ((this.project != null) && msg.project === this.project.id) {
          return this.project.fileLocked(msg);
        }
        break;
      case "project_file_update":
        if ((this.project != null) && msg.project === this.project.id) {
          return this.project.fileUpdated(msg);
        }
        break;
      case "project_file_deleted":
        if ((this.project != null) && msg.project === this.project.id) {
          return this.project.fileDeleted(msg);
        }
        break;
      case "project_options_updated":
        if ((this.project != null) && msg.project === this.project.id) {
          this.project.optionsUpdated(msg);
          return this.options.projectOpened();
        }
    }
  };

  App.prototype.updateProjectUserList = function(msg) {
    if ((this.project != null) && msg.project === this.project.id) {
      this.project.users = msg.users;
      return this.options.updateUserList();
    }
  };

  App.prototype.getUserSetting = function(setting) {
    if ((this.user != null) && (this.user.settings != null)) {
      return this.user.settings[setting];
    } else {
      return null;
    }
  };

  App.prototype.setUserSetting = function(setting, value) {
    if (this.user != null) {
      if (this.user.settings == null) {
        this.user.settings = {};
      }
      this.user.settings[setting] = value;
      return this.client.sendRequest({
        name: "set_user_setting",
        setting: setting,
        value: value
      }, (function(_this) {
        return function(msg) {};
      })(this));
    }
  };

  App.prototype.setTutorialProgress = function(tutorial_id, progress) {
    var tutorial_progress;
    tutorial_progress = this.getUserSetting("tutorial_progress");
    if (tutorial_progress == null) {
      tutorial_progress = {};
    }
    tutorial_progress[tutorial_id] = progress;
    return this.setUserSetting("tutorial_progress", tutorial_progress);
  };

  App.prototype.getTutorialProgress = function(tutorial_id) {
    var tutorial_progress;
    tutorial_progress = this.getUserSetting("tutorial_progress");
    if (tutorial_progress == null) {
      return 0;
    } else {
      return tutorial_progress[tutorial_id] || 0;
    }
  };

  App.prototype.setProjectTutorial = function(project_slug, tutorial_id) {
    var project_tutorial;
    project_tutorial = this.getUserSetting("project_tutorial");
    if (project_tutorial == null) {
      project_tutorial = {};
    }
    project_tutorial[project_slug] = tutorial_id;
    return this.setUserSetting("project_tutorial", project_tutorial);
  };

  App.prototype.getProjectTutorial = function(slug) {
    var project_tutorial;
    project_tutorial = this.getUserSetting("project_tutorial");
    if (project_tutorial == null) {
      return null;
    } else {
      return project_tutorial[slug];
    }
  };

  App.prototype.setHomeState = function() {
    if (this.translator.lang !== "en") {
      return history.replaceState(null, "microStudio", "/" + this.translator.lang + "/");
    } else {
      return history.replaceState(null, "microStudio", "/");
    }
  };

  App.prototype.setState = function(state) {};

  App.prototype.getTierName = function(tier) {
    switch (tier) {
      case "pixel_master":
        return "Pixel Master";
      case "code_ninja":
        return "Code Ninja";
      case "gamedev_lord":
        return "Gamedev Lord";
      case "founder":
        return "Founder";
      case "sponsor":
        return "Sponsor";
      default:
        return "Standard";
    }
    return "";
  };

  return App;

})();
