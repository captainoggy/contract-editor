interface Change {
  id: string;
  text: string;
  oldText: string;
  lineNumber: number;
  type: "addition" | "deletion" | "modification";
  status: "pending" | "approved" | "rejected";
  lineDiffs: Array<[number, string, string?]>; // Store character-level changes
  position: { start: number; end: number };
}

interface TinyMCEEditor {
  getContent(): string;
  setContent(content: string): void;
}

class ContractEditor {
  private originalText: string = "";
  private modifiedText: string = "";
  private changes: Change[] = [];
  private editor1!: TinyMCEEditor;
  private editor2!: TinyMCEEditor;

  constructor() {
    this.initializeEditors();
    this.setupEventListeners();
  }

  private initializeEditors() {
    const plugins = [
      "advlist",
      "autolink",
      "lists",
      "link",
      "image",
      "charmap",
      "preview",
      "anchor",
      "searchreplace",
      "visualblocks",
      "code",
      "fullscreen",
      "insertdatetime",
      "media",
      "table",
      "code",
      "help",
      "wordcount",
      "powerpaste",
      "signature",
    ];

    const toolbarConfig = [
      "undo redo",
      "formatselect | bold italic underline strikethrough",
      "alignleft aligncenter alignright alignjustify",
      "bullist numlist outdent indent",
      "table link image media signature",
      "fullscreen code",
    ].join(" | ");

    // Initialize TinyMCE editors with shared config
    const editorConfig = {
      height: 500,
      menubar: true,
      plugins: plugins,
      toolbar: toolbarConfig,
      content_style: "body { font-family: var(--font-body); }",
      signature_config: {
        width: 400,
        height: 200,
        borderStyle: "solid",
        borderWidth: 1,
        borderColor: "#999999",
        backgroundColor: "#FFFFFF",
        lineWidth: 2,
        lineColor: "#000000",
        dialogTitle: "Add Your Signature",
        dialogOkText: "Insert Signature",
        dialogCancelText: "Cancel",
        dialogClearText: "Clear",
        dialogPenText: "Draw",
        dialogUploadText: "Upload",
        uploadConfig: {
          accept: "image/png,image/jpeg",
          maxFileSize: 5242880, // 5MB
        },
      },
      powerpaste_allow_local_images: true,
      powerpaste_word_import: "clean",
      powerpaste_html_import: "clean",
      images_upload_handler: (blobInfo: any, progress: any) =>
        new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e: ProgressEvent<FileReader>) => {
            if (e.target?.result && typeof e.target.result === "string") {
              resolve(e.target.result);
            } else {
              reject("Failed to read file");
            }
          };
          reader.onerror = () => reject("Failed to upload image");
          reader.readAsDataURL(blobInfo.blob());
        }),
    };

    // Initialize first editor
    tinymce
      .init({
        ...editorConfig,
        selector: "#editor1",
      })
      .then((editors: TinyMCEEditor[]) => {
        this.editor1 = editors[0];
      });

    // Initialize second editor
    tinymce
      .init({
        ...editorConfig,
        selector: "#editor2",
      })
      .then((editors: TinyMCEEditor[]) => {
        this.editor2 = editors[0];
      });
  }

  private setupEventListeners() {
    // Navigation
    const segment = document.getElementById("navSegment");
    segment?.addEventListener("ionChange", (e: any) =>
      this.handleNavigation(e)
    );

    // Save buttons
    document.getElementById("saveInitial")?.addEventListener("click", () => {
      this.saveInitialContent();
      this.scrollToTop();
    });
    document.getElementById("saveEdits")?.addEventListener("click", () => {
      this.saveEdits();
      this.scrollToTop();
    });
    document.getElementById("saveReview")?.addEventListener("click", () => {
      this.completeReview();
      this.scrollToTop();
    });
  }

  private scrollToTop() {
    const content = document.querySelector(
      "ion-content"
    ) as HTMLIonContentElement;
    if (content) {
      content.scrollToTop(500);
    }
  }

  private handleNavigation(event: any) {
    const selectedPage = event.detail.value;
    document.querySelectorAll(".page").forEach((page) => {
      page.classList.remove("active");
    });

    const activePage = document.getElementById(selectedPage);
    if (activePage) {
      activePage.classList.add("active");
    }

    if (selectedPage === "edit" && this.originalText) {
      this.editor2.setContent(this.originalText);
    }
  }

  private saveInitialContent() {
    this.originalText = this.editor1.getContent();
    const segment = document.getElementById("navSegment") as any;
    segment.value = "edit";
    this.handleNavigation({ detail: { value: "edit" } });
  }

  private saveEdits() {
    this.modifiedText = this.editor2.getContent();
    this.generateDiff();
    const segment = document.getElementById("navSegment") as any;
    segment.value = "review";
    this.handleNavigation({ detail: { value: "review" } });
  }

  private generateDiff() {
    const dmp = new diff_match_patch();

    // Split into lines and normalize
    const lines1 = this.originalText.split(/\r?\n/);
    const lines2 = this.modifiedText.split(/\r?\n/);

    this.changes = [];
    let changeCount = 0;

    // Compare each line
    for (let i = 0; i < Math.max(lines1.length, lines2.length); i++) {
        const oldLine = lines1[i] || "";
        const newLine = lines2[i] || "";

        if (oldLine === "" && newLine !== "") {
            // This is a pure addition
            this.changes.push({
                id: `change-${changeCount}`,
                text: newLine,
                oldText: "",
                lineNumber: i + 1,
                type: "addition",
                status: "pending",
                lineDiffs: [[1, newLine]],
                position: { start: i, end: i + 1 }
            });
            changeCount++;
        } else if (oldLine !== "" && newLine === "") {
            // This is a pure deletion
            this.changes.push({
                id: `change-${changeCount}`,
                text: "",
                oldText: oldLine,
                lineNumber: i + 1,
                type: "deletion",
                status: "pending",
                lineDiffs: [[-1, oldLine]],
                position: { start: i, end: i + 1 }
            });
            changeCount++;
        } else if (oldLine !== newLine) {
            // This is a modification
            const diffs = dmp.diff_main(oldLine, newLine);
            dmp.diff_cleanupSemantic(diffs);

            const groupedDiffs: Array<[number, string, string?]> = [];
            diffs.forEach(([type, text], index) => {
                if (type === 0) {
                    groupedDiffs.push([0, text]);
                } else if (type === -1) {
                    const nextDiff = diffs[index + 1];
                    if (nextDiff && nextDiff[0] === 1) {
                        groupedDiffs.push([-1, text, nextDiff[1]]);
                        diffs[index + 1] = [0, ""];
                    } else {
                        groupedDiffs.push([-1, text]);
                    }
                } else if (type === 1) {
                    if (diffs[index - 1]?.[0] !== -1) {
                        groupedDiffs.push([1, text]);
                    }
                }
            });

            this.changes.push({
                id: `change-${changeCount}`,
                text: newLine,
                oldText: oldLine,
                lineNumber: i + 1,
                type: "modification",
                status: "pending",
                lineDiffs: groupedDiffs,
                position: { start: i, end: i + 1 }
            });
            changeCount++;
        }
    }

    this.displayChanges();
  }

  private displayChanges() {
    const changesList = document.getElementById("changesList");
    if (!changesList) return;

    let reviewHtml = `
            <div class="review-layout">
                <div class="changes-panel">
                    <h3>Review Changes</h3>
                    <div class="changes-info">
                        <p>Review each change. All changes are initially pending.</p>
                        <ul>
                            <li>⚪ Pending: Change needs review</li>
                            <li>✓ Checked: Change is approved</li>
                            <li>✗ Unchecked: Change is rejected</li>
                        </ul>
                    </div>
                    <div class="changes-list">`;

    this.changes.forEach((change, changeIndex) => {
      reviewHtml += `
                <div class="change-item ${change.type}">
                    <div class="change-header">
                        <span class="change-type">${
                          change.type.charAt(0).toUpperCase() +
                          change.type.slice(1)
                        }</span>
                        <span class="line-number">Line ${
                          change.lineNumber
                        }</span>
                    </div>
                    <div class="change-content">
                        <div class="change-details">
                            <div class="inline-diff">`;

      // Show context and changes with individual checkboxes
      if (change.type === "modification") {
        let currentLine = "";
        change.lineDiffs.forEach(([type, text, newText], index) => {
          if (type === 0) {
            currentLine += text;
          } else {
            // Use simpler ID format - just use the change index
            const changeId = `change-${changeIndex}`; // Simplified ID
            if (type === -1 && newText) {
              currentLine += `<span class="inline-change">
                                <input type="checkbox" 
                                    id="${changeId}" 
                                    class="change-checkbox">
                                <span class="diff-highlight deletion">${text}</span>
                                <span class="diff-highlight addition">${newText}</span>
                            </span>`;
            } else {
              currentLine += `<span class="inline-change">
                                <input type="checkbox" 
                                    id="${changeId}" 
                                    class="change-checkbox">
                                <span class="diff-highlight ${
                                  type === -1 ? "deletion" : "addition"
                                }">${text}</span>
                            </span>`;
            }
          }
        });
        reviewHtml += `<div class="line-content">${currentLine}</div>`;
      } else {
        // Simple addition or deletion
        const text = change.type === "deletion" ? change.oldText : change.text;
        reviewHtml += `
                    <div class="line-content">
                        <span class="inline-change">
                            <input type="checkbox" 
                                id="change-${changeIndex}" 
                                class="change-checkbox">
                            <span class="diff-highlight ${change.type}">${text}</span>
                        </span>
                    </div>`;
      }

      reviewHtml += `
                            </div>
                        </div>
                    </div>
                </div>`;
    });

    reviewHtml += `
                    </div>
                </div>
            </div>`;

    changesList.innerHTML = reviewHtml;
    this.setupChangeListeners();

    // Set all checkboxes to indeterminate state initially
    const checkboxes = document.querySelectorAll(
      ".change-checkbox"
    ) as NodeListOf<HTMLInputElement>;
    checkboxes.forEach((checkbox) => {
      checkbox.indeterminate = true;
    });
  }

  private setupChangeListeners() {
    const checkboxes = document.querySelectorAll(
      ".change-checkbox"
    ) as NodeListOf<HTMLInputElement>;
    const saveButton = document.getElementById(
      "saveReview"
    ) as HTMLButtonElement;

    checkboxes.forEach((checkbox) => {
      // Set initial state
      checkbox.indeterminate = true;

      checkbox.addEventListener("click", (e: Event) => {
        const checkbox = e.target as HTMLInputElement;

        // Simplified ID extraction
        const changeIndex = parseInt(checkbox.id.split("-")[1]);
        const change = this.changes[changeIndex];

        if (!change) {
          console.error("No change found for index:", changeIndex);
          return;
        }

        if (checkbox.checked) {
          change.status = "approved";
        } else {
          change.status = "rejected";
        }

        this.updateSaveButtonState();
      });
    });

    if (saveButton) {
      saveButton.addEventListener("click", () => {
        this.completeReview();
      });
    }

    this.updateSaveButtonState();
  }

  private updateSaveButtonState() {
    const saveButton = document.getElementById(
      "saveReview"
    ) as HTMLButtonElement;
    if (!saveButton) return;

    // Get all checkboxes
    const checkboxes = document.querySelectorAll(
      ".change-checkbox"
    ) as NodeListOf<HTMLInputElement>;

    // Check if any checkbox is in indeterminate state
    const hasIndeterminateCheckbox = Array.from(checkboxes).some(
      (checkbox) => checkbox.indeterminate
    );

    // Disable button if any checkbox is indeterminate
    saveButton.disabled = hasIndeterminateCheckbox;
  }

  private completeReview() {
    const pendingChanges = this.changes.some(change => change.status === 'pending');
    if (pendingChanges) {
        alert('Please review all changes before proceeding.');
        return;
    }

    // Process only approved changes
    const approvedChanges = this.changes.filter(change => change.status === 'approved');
    let lines = this.originalText.split('\n');

    // Sort changes by line number in descending order
    approvedChanges.sort((a, b) => b.lineNumber - a.lineNumber);

    // Apply approved changes
    approvedChanges.forEach(change => {
        const lineIndex = change.lineNumber - 1;
        
        if (lineIndex < lines.length) {
            let currentLine = lines[lineIndex];
            
            switch (change.type) {
                case 'modification':
                    change.lineDiffs.forEach(([type, text, newText]) => {
                        if (type === -1) {
                            // Handle replacements - this works correctly
                            currentLine = currentLine.replace(text, newText || '');
                        } else if (type === 1) {
                            // For pure additions, we need to find the correct position
                            const diffs = change.lineDiffs;
                            const currentDiffIndex = diffs.findIndex(d => d[1] === text);
                            
                            if (currentDiffIndex > 0) {
                                // Look at the previous diff to determine position
                                const prevDiff = diffs[currentDiffIndex - 1];
                                if (prevDiff[0] === 0) {
                                    // If previous diff is unchanged text, add after it
                                    const pos = currentLine.indexOf(prevDiff[1]) + prevDiff[1].length;
                                    currentLine = currentLine.slice(0, pos) + text + currentLine.slice(pos);
                                }
                            }
                        }
                    });
                    break;

                case 'deletion':
                    // Simple text removal - this works correctly
                    change.lineDiffs.forEach(([type, text]) => {
                        if (type === -1) {
                            currentLine = currentLine.replace(text, '');
                        }
                    });
                    break;

                case 'addition':
                    // For new line additions
                    if (change.text) {
                        lines.splice(lineIndex, 0, change.text);
                        return; // Skip the currentLine update
                    }
                    break;
            }
            
            lines[lineIndex] = currentLine;
        }
    });

    const finalText = lines.join('\n');

    // Update final content
    const finalContent = document.getElementById('finalContent');
    if (finalContent) {
        finalContent.innerHTML = finalText;
    }

    // Navigate to complete page
    const segment = document.getElementById('navSegment') as any;
    segment.value = 'complete';
    this.handleNavigation({ detail: { value: 'complete' } });
  }
}

// Initialize the application
document.addEventListener("DOMContentLoaded", () => {
  new ContractEditor();
});
