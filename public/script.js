document.querySelectorAll(".view-students").forEach((button) => {
  button.addEventListener("click", function () {
    const subjectId = this.getAttribute("data-id");
    window.location.href = `/faculty/subjects/${subjectId}/students`;
  });
});

document.querySelectorAll(".create-exam").forEach((button) => {
  button.addEventListener("click", function () {
    window.location.href = `/faculty/exams/create`;
  });
});
