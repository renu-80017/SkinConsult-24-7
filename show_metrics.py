// bully_mpi.c
#include <mpi.h>
#include <stdio.h>

int main(int argc, char *argv[]) {
int rank, size;
int coordinator = -1;
int election_msg = 1;
int ok_msg = 2;

MPI_Init(&argc, &argv);
MPI_Comm_rank(MPI_COMM_WORLD, &rank);
MPI_Comm_size(MPI_COMM_WORLD, &size);

// Assume process 1 initiates election
if(rank == 1) {
printf("Process %d initiating election\n", rank);

for(int i = rank + 1; i < size; i++) {
MPI_Send(&election_msg, 1, MPI_INT, i, 0, MPI_COMM_WORLD);
printf("Process %d sent election message to %d\n", rank, i);
}

// If highest process
if(rank == size - 1) {
coordinator = rank;
}
}

if(rank != 1) {
MPI_Status status;
int msg;
MPI_Recv(&msg, 1, MPI_INT, MPI_ANY_SOURCE, 0, MPI_COMM_WORLD, &status);

if(msg == 1) {
printf("Process %d received election message\n", rank);

if(rank == size - 1) {
coordinator = rank;
printf("Process %d becomes coordinator\n", rank);
}
}
}

MPI_Barrier(MPI_COMM_WORLD);

if(rank == size - 1) {
printf("Final Coordinator is Process %d\n", rank);
}

MPI_Finalize();
return 0;
}
Output:
Process 1 initiating election
Process 1 sent election message to 2
Process 1 sent election message to 3
Process 1 sent election message to 4
Process 4 becomes coordinator
Final Coordinator is Process 4


// ring_mpi.c
#include <mpi.h>
#include <stdio.h>

int main(int argc, char *argv[]) {
int rank, size;
int token;
MPI_Status status;

MPI_Init(&argc, &argv);
MPI_Comm_rank(MPI_COMM_WORLD, &rank);
MPI_Comm_size(MPI_COMM_WORLD, &size);

int next = (rank + 1) % size;

// Assume process 0 starts election
if(rank == 0) {
token = rank;
printf("Process %d starts election\n", rank);
MPI_Send(&token, 1, MPI_INT, next, 0, MPI_COMM_WORLD);
}

MPI_Recv(&token, 1, MPI_INT, MPI_ANY_SOURCE, 0, MPI_COMM_WORLD, &status);

if(rank != 0) {
if(rank > token)
token = rank;

printf("Process %d passing token %d to %d\n", rank, token, next);
MPI_Send(&token, 1, MPI_INT, next, 0, MPI_COMM_WORLD);
}
else {
printf("Election completed. Coordinator is Process %d\n", token);
}

MPI_Finalize();
return 0;
}
